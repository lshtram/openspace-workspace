import express from 'express';
import { ArtifactStore, WriteOptions } from './services/ArtifactStore.js';
import { PatchEngine } from './services/PatchEngine.js';
import { ActiveContext, createPlatformEvent } from './interfaces/platform.js';
import { parseActiveContextRequest } from './interfaces/context-contract.js';
import { PolicyViolation, assertLegacyWriteAllowed, assertUserDirectWriteMode } from './interfaces/write-policy.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase limit for images

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, '../../');
const store = new ArtifactStore(projectRoot);
const patchEngine = new PatchEngine(store);
const designRoot = path.join(projectRoot, 'design');

const now = () => new Date().toISOString();

interface StoredActiveContext extends ActiveContext {
  timestamp: string;
}

const logDesignDir = (status: 'start' | 'success' | 'failure', meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  if (status === 'failure') {
    console.error('[HubServer] design dir failure', payload);
    return;
  }
  console.log(`[HubServer] design dir ${status}`, payload);
};

const ensureDesignDirectory = async () => {
  logDesignDir('start', { designRoot });
  try {
    await fs.mkdir(designRoot, { recursive: true });
    logDesignDir('success', { designRoot });
  } catch (error) {
    logDesignDir('failure', {
      designRoot,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const validateArtifactPath = (rawPath: string): { ok: true; normalizedPath: string } | { ok: false; reason: string } => {
  if (!rawPath || rawPath.trim().length === 0) {
    return { ok: false, reason: 'Artifact path is required' };
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedPath.length === 0) {
    return { ok: false, reason: 'Artifact path is required' };
  }

  if (normalizedPath.includes('..')) {
    return { ok: false, reason: 'Path traversal is not allowed' };
  }

  if (!normalizedPath.startsWith('design/')) {
    return { ok: false, reason: 'Artifacts must be under design/' };
  }

  return { ok: true, normalizedPath };
};

const logIo = (status: 'start' | 'success' | 'failure', operation: string, meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  const prefix = `[${payload.ts}] HUB_${operation}_${status.toUpperCase()}`;
  if (status === 'failure') {
    console.error(prefix, payload);
    return;
  }
  console.log(prefix, payload);
};

// Active Context Store (In-Memory)
let activeContext: StoredActiveContext | null = null;

const getActiveWhiteboard = (): string | null => {
  if (!activeContext || activeContext.modality !== 'whiteboard') {
    return null;
  }

  return activeContext.data.path;
};

app.post('/context/active', (req, res) => {
  try {
    const parsed = parseActiveContextRequest(req.body);
    activeContext = { ...parsed, timestamp: now() };
    console.log('[HubServer] Active context set', { ...activeContext, ts: now() });
    res.json({ success: true, activeContext });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/context/active', (req, res) => {
  res.json(activeContext);
});

app.post('/context/active-whiteboard', (req, res) => {
  if ((req.body as { filePath?: unknown } | undefined)?.filePath !== undefined) {
    try {
      const parsed = parseActiveContextRequest(req.body, { legacyWhiteboardAlias: true });
      activeContext = { ...parsed, timestamp: now() };
      console.log('[HubServer] Active whiteboard set', { filePath: activeContext.data.path, ts: now() });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  res.setHeader('Warning', '299 - Deprecated endpoint. Use /context/active instead.');
  res.json({ success: true, activeWhiteboard: getActiveWhiteboard() });
});

app.get('/context/active-whiteboard', (req, res) => {
  res.setHeader('Warning', '299 - Deprecated endpoint. Use /context/active instead.');
  res.json({ activeWhiteboard: getActiveWhiteboard() });
});

// Server-Sent Events (SSE) endpoint for real-time file updates
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onPlatformEvent = (event: {
    type: 'ARTIFACT_UPDATED' | 'PATCH_APPLIED' | 'VALIDATION_FAILED';
    modality: string;
    artifact: string;
    actor: string;
    timestamp: string;
    version?: number;
    details?: Record<string, unknown>;
  }) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  store.on('ARTIFACT_UPDATED', onPlatformEvent);
  store.on('PATCH_APPLIED', onPlatformEvent);
  store.on('VALIDATION_FAILED', onPlatformEvent);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    store.off('ARTIFACT_UPDATED', onPlatformEvent);
    store.off('PATCH_APPLIED', onPlatformEvent);
    store.off('VALIDATION_FAILED', onPlatformEvent);
    clearInterval(heartbeat);
  });
});

app.post(/^\/(files|artifacts)\/(.+)\/patch$/, async (req, res) => {
  const match = req.path.match(/^\/(files|artifacts)\/(.+)\/patch$/);
  if (!match) {
    return res.status(404).json({ error: 'Invalid patch route' });
  }

  const routeName = match[1];
  const rawPath = match[2];

  if (routeName === 'artifacts') {
    res.setHeader('Warning', '299 - Deprecated endpoint. Use /files/:path/patch instead.');
  }

  const validation = validateArtifactPath(rawPath);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.reason });
  }

  const filePath = validation.normalizedPath;
  logIo('start', 'PATCH_APPLY', { filePath });

  try {
    const result = await patchEngine.apply(filePath, req.body);

    const actor = (req.body as { actor?: 'user' | 'agent' } | undefined)?.actor ?? 'agent';
    store.emit(
      'PATCH_APPLIED',
      createPlatformEvent('PATCH_APPLIED', {
        modality: filePath.endsWith('.graph.mmd') || filePath.endsWith('.excalidraw') ? 'whiteboard' : 'editor',
        artifact: filePath,
        actor,
        version: result.version,
      }),
    );

    logIo('success', 'PATCH_APPLY', { filePath, version: result.version });
    return res.json({ success: true, filePath, version: result.version, bytes: result.bytes });
  } catch (error: any) {
    const envelope = {
      code: error?.code ?? 'PATCH_FAILED',
      location: error?.location ?? 'body',
      reason: error?.reason ?? (error instanceof Error ? error.message : String(error)),
      remediation: error?.remediation ?? 'Fix the request and retry',
    };

    store.emit(
      'VALIDATION_FAILED',
      createPlatformEvent('VALIDATION_FAILED', {
        modality: filePath.endsWith('.graph.mmd') || filePath.endsWith('.excalidraw') ? 'whiteboard' : 'editor',
        artifact: filePath,
        actor: 'system',
        details: envelope,
      }),
    );

    logIo('failure', 'PATCH_APPLY', { filePath, ...envelope });
    const status = envelope.code === 'VERSION_CONFLICT' ? 409 : 400;
    return res.status(status).json({
      error: envelope,
      currentVersion: envelope.code === 'VERSION_CONFLICT' ? patchEngine.getVersion(filePath) : undefined,
    });
  }
});

// Internal API for MCP servers and Client
app.use(['/artifacts', '/files'], async (req, res, next) => {
  const isDeprecatedArtifactsRoute = req.baseUrl === '/artifacts';

  if (isDeprecatedArtifactsRoute) {
    res.setHeader('Warning', '299 - Deprecated endpoint. Use /files/:path instead.');
  }

  // Strip leading slash to make it relative to project root
  const rawPath = req.path.startsWith('/') ? req.path.substring(1) : req.path;
  const validation = validateArtifactPath(rawPath);

  if (!rawPath) {
    return next();
  }

  if (!validation.ok) {
    return res.status(400).json({ error: validation.reason });
  }

  const filePath = validation.normalizedPath;

  if (req.method === 'GET') {
    try {
      logIo('start', 'FILE_READ', { filePath });
      const content = await store.read(filePath);
      logIo('success', 'FILE_READ', { filePath });
      res.send(content);
    } catch (error: any) {
      logIo('failure', 'FILE_READ', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Artifact not found' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  } else if (req.method === 'POST') {
    const { content, opts, encoding } = req.body;
    
    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Content is required' });
    }

    try {
      if (!opts || typeof opts !== 'object') {
        return res.status(400).json({ error: 'opts is required' });
      }

      assertUserDirectWriteMode(req.header('x-openspace-write-mode') ?? undefined);

      const writeOpts = opts as WriteOptions;
      assertLegacyWriteAllowed(writeOpts);

      let finalContent = content;
      if (encoding === 'base64') {
        finalContent = Buffer.from(content, 'base64');
      }

      logIo('start', 'FILE_WRITE', { filePath });
      await store.write(filePath, finalContent, writeOpts);
      logIo('success', 'FILE_WRITE', { filePath });
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof PolicyViolation) {
        logIo('failure', 'FILE_WRITE', { filePath, code: error.code, reason: error.reason });
        return res.status(400).json({
          error: {
            code: error.code,
            location: error.location,
            reason: error.reason,
            remediation: error.remediation,
          },
        });
      }
      logIo('failure', 'FILE_WRITE', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: error.message });
    }
  } else {
    next();
  }
});
  


const PORT = process.env.HUB_PORT || 3001;

const startServer = async () => {
  await ensureDesignDirectory();
  app.listen(PORT, () => {
    console.log(`[HubServer] Internal API listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('[HubServer] Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
    ts: now(),
  });
  process.exit(1);
});
