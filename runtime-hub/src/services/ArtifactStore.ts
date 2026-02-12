import fs from 'fs/promises';
import path from 'path';
import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import { createPlatformEvent } from '../interfaces/platform.js';
import chokidar from 'chokidar';

// @ts-ignore
const PQueueCtor = (PQueue.default || PQueue) as any;
const now = () => new Date().toISOString();

const logIo = (status: 'start' | 'success' | 'failure', operation: string, meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  const prefix = `[${payload.ts}] ARTIFACT_${operation}_${status.toUpperCase()}`;
  if (status === 'failure') {
    console.error(prefix, payload);
    return;
  }
  console.log(prefix, payload);
};

export interface WriteOptions {
  actor: 'user' | 'agent';
  reason: string;
  debounce?: boolean;
  createSnapshot?: boolean;
  tool_call_id?: string;
}

export interface ArtifactEvent {
  ts: string;
  artifact: string;
  action: 'UPDATE' | 'CREATE' | 'DELETE';
  actor: 'user' | 'agent';
  reason: string;
  tool_call_id?: string;
  size_bytes?: number;
}

interface DebounceContext {
  timer: NodeJS.Timeout;
  resolve: () => void;
}

export class ArtifactStore extends EventEmitter {
  private queue = new PQueueCtor({ concurrency: 1 });
  private debounceContexts = new Map<string, DebounceContext>();
  private projectRoot: string;
  private watcher: ReturnType<typeof chokidar.watch> | null = null;
  private internalWriteInProgress = new Set<string>();

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
    this.initializeWatcher();
  }

  private initializeWatcher(): void {
    const designPath = path.join(this.projectRoot, 'design');
    console.log(`[ArtifactStore] Initializing file watcher for: ${designPath}`);
    
    this.watcher = chokidar.watch(designPath, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.watcher.on('change', (absolutePath: string) => {
      // Convert to relative path
      const relativePath = path.relative(this.projectRoot, absolutePath).replace(/\\/g, '/');
      
      // Skip if this was an internal write (to prevent loops)
      if (this.internalWriteInProgress.has(relativePath)) {
        console.log(`[ArtifactStore] Skipping self-triggered change: ${relativePath}`);
        return;
      }

      // External change detected (likely from agent via filesystem tools)
      console.log(`[ArtifactStore] ✅ External file change detected: ${relativePath}`);
      console.log(`[ArtifactStore] ✅ Emitting FILE_CHANGED event with actor=agent`);
      
      // Emit events for SSE subscribers
      this.emit('FILE_CHANGED', { path: relativePath, actor: 'agent' });
      this.emit(
        'ARTIFACT_UPDATED',
        createPlatformEvent('ARTIFACT_UPDATED', {
          modality: this.inferModality(relativePath),
          artifact: relativePath,
          actor: 'agent',
        }),
      );
    });

    this.watcher.on('error', (error: unknown) => {
      console.error('[ArtifactStore] Watcher error:', error);
    });
  }

  public close(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private assertInsideProjectRoot(absolutePath: string): void {
    const normalizedProjectRoot = path.resolve(this.projectRoot);
    const normalizedTargetPath = path.resolve(absolutePath);
    const withSep = `${normalizedProjectRoot}${path.sep}`;
    if (normalizedTargetPath !== normalizedProjectRoot && !normalizedTargetPath.startsWith(withSep)) {
      throw new Error(`Path escapes project root: ${absolutePath}`);
    }
  }

  private resolvePath(filePath: string): string {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
    this.assertInsideProjectRoot(absolutePath);
    return absolutePath;
  }

  private inferModality(filePath: string): string {
    if (filePath.endsWith('.graph.mmd') || filePath.endsWith('.excalidraw')) {
      return 'whiteboard';
    }
    if (filePath.endsWith('.deck.md')) {
      return 'presentation';
    }
    return 'editor';
  }

  /**
   * Universal Read Method
   */
  async read(filePath: string): Promise<Buffer> {
    const absolutePath = this.resolvePath(filePath);
    try {
      logIo('start', 'READ', { filePath });
      const data = await fs.readFile(absolutePath);
      logIo('success', 'READ', { filePath, bytes: data.byteLength });
      return data;
    } catch (error) {
      logIo('failure', 'READ', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Universal Write Method
   * Serialized via PQueue for atomicity and race-condition prevention.
   */
  async write(filePath: string, content: string | Buffer, opts: WriteOptions): Promise<void> {
    const absolutePath = this.resolvePath(filePath);

    if (opts.debounce) {
      return this.scheduleDebounce(filePath, content, opts);
    }

    return this.queue.add(async () => {
      // Mark as internal write to prevent watcher loop
      this.internalWriteInProgress.add(filePath);
      
      try {
        logIo('start', 'WRITE', { filePath, actor: opts.actor });
        const exists = await fs.access(absolutePath).then(() => true).catch(() => false);

        // 1. Ensure directory exists
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });

        // 2. Rolling History (REQ-CORE-05)
        if (exists) {
          await this.createBackup(filePath, absolutePath);
        }

        // 3. Atomic Write: write_tmp -> rename
        const tempPath = `${absolutePath}.tmp`;
        await fs.writeFile(tempPath, content);
        
        // Ensure data is flushed to disk (safety)
        const fileHandle = await fs.open(tempPath, 'r+');
        await fileHandle.sync();
        await fileHandle.close();
        
        await fs.rename(tempPath, absolutePath);

        // 4. Audit Logging (REQ-CORE-06)
        await this.logEvent(filePath, absolutePath, opts, exists ? 'UPDATE' : 'CREATE');

        // 5. Broadcast Change
        this.emit('FILE_CHANGED', { path: filePath, actor: opts.actor });
        this.emit(
          'ARTIFACT_UPDATED',
          createPlatformEvent('ARTIFACT_UPDATED', {
            modality: this.inferModality(filePath),
            artifact: filePath,
            actor: opts.actor,
          }),
        );
        
        logIo('success', 'WRITE', { filePath, actor: opts.actor, action: exists ? 'UPDATE' : 'CREATE' });
      } catch (error) {
        logIo('failure', 'WRITE', {
          filePath,
          actor: opts.actor,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        // Clear internal write flag after a delay to let the watcher catch up
        setTimeout(() => {
          this.internalWriteInProgress.delete(filePath);
        }, 500);
      }
    });
  }

  private async scheduleDebounce(filePath: string, content: string | Buffer, opts: WriteOptions): Promise<void> {
    const existing = this.debounceContexts.get(filePath);
    if (existing) {
      clearTimeout(existing.timer);
      // Resolve the previous promise - it's being superseded
      existing.resolve();
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        this.debounceContexts.delete(filePath);
        try {
          await this.write(filePath, content, { ...opts, debounce: false });
        } finally {
          resolve();
        }
      }, 500);
      
      this.debounceContexts.set(filePath, { timer, resolve });
    });
  }

  private async createBackup(filePath: string, absolutePath: string): Promise<void> {
    try {
      logIo('start', 'BACKUP', { filePath });
      const historyDir = path.join(this.projectRoot, '.opencode', 'artifacts', 'history', filePath);
      await fs.mkdir(historyDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(historyDir, `v${timestamp}.bak`);
      
      await fs.copyFile(absolutePath, backupPath);

      // Rolling window: keep last 20
      const files = await fs.readdir(historyDir);
      if (files.length > 20) {
        // Sort by name (timestamp)
        const sorted = files.sort();
        const toDelete = sorted.slice(0, files.length - 20);
        for (const file of toDelete) {
          await fs.unlink(path.join(historyDir, file));
        }
      }
      logIo('success', 'BACKUP', { filePath });
    } catch (error) {
      logIo('failure', 'BACKUP', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async logEvent(filePath: string, absolutePath: string, opts: WriteOptions, action: 'CREATE' | 'UPDATE'): Promise<void> {
    try {
      logIo('start', 'EVENT_LOG', { filePath, action });
      const stats = await fs.stat(absolutePath);
      const event: ArtifactEvent = {
        ts: new Date().toISOString(),
        artifact: filePath,
        action,
        actor: opts.actor,
        reason: opts.reason,
        tool_call_id: opts.tool_call_id,
        size_bytes: stats.size
      };

      const logPath = path.join(this.projectRoot, '.opencode', 'artifacts', 'events.ndjson');
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.appendFile(logPath, JSON.stringify(event) + '\n');
      logIo('success', 'EVENT_LOG', { filePath, action, size: stats.size });
    } catch (error) {
      logIo('failure', 'EVENT_LOG', {
        filePath,
        action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
