import fs from 'fs/promises';
import path from 'path';
import PQueue from 'p-queue';
import { EventEmitter } from 'events';

// @ts-ignore
const PQueueCtor = (PQueue.default || PQueue) as any;

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

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
  }

  private resolvePath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
  }

  /**
   * Universal Read Method
   */
  async read(filePath: string): Promise<Buffer> {
    const absolutePath = this.resolvePath(filePath);
    try {
      return await fs.readFile(absolutePath);
    } catch (error) {
      console.error(`[ArtifactStore] Failed to read ${filePath}:`, error);
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
      try {
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
        
        console.log(`[ArtifactStore] Saved: ${filePath} by ${opts.actor} (${exists ? 'UPDATE' : 'CREATE'})`);
      } catch (error) {
        console.error(`[ArtifactStore] Failed to write ${filePath}:`, error);
        throw error;
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
    } catch (error) {
      console.warn(`[ArtifactStore] Backup failed for ${filePath}:`, error);
    }
  }

  private async logEvent(filePath: string, absolutePath: string, opts: WriteOptions, action: 'CREATE' | 'UPDATE'): Promise<void> {
    try {
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
    } catch (error) {
      console.warn(`[ArtifactStore] Event logging failed:`, error);
    }
  }
}
