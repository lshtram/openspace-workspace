import express from 'express';
import { ArtifactStore, WriteOptions } from './services/ArtifactStore.js';
import { PatchEngine } from './services/PatchEngine.js';
import { ActiveContext } from './interfaces/platform.js';
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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-openspace-write-mode');
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

const ACTIVE_MODALITIES = ['drawing', 'editor', 'whiteboard', 'presentation'] as const;
type ActiveModality = (typeof ACTIVE_MODALITIES)[number];

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

  const ALLOWED_ROOT_FILES = ['README.md', 'CONTRIBUTING.md'];
  if (!normalizedPath.startsWith('design/') && !ALLOWED_ROOT_FILES.includes(normalizedPath)) {
    return { ok: false, reason: 'Artifacts must be under design/ (except for root documentation)' };
  }

  return { ok: true, normalizedPath };
};

const requireNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value;
};

const parseActiveContextBody = (body: unknown): ActiveContext => {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const payload = body as any;
  const modality = requireNonEmptyString(payload.modality, 'modality');
  const rawPath = payload.data?.path || payload.filePath;

  if (!rawPath) {
    throw new Error('filePath or data.path is required');
  }

  if (!ACTIVE_MODALITIES.includes(modality as any)) {
    throw new Error(`modality must be one of: ${ACTIVE_MODALITIES.join(', ')}`);
  }

  const validation = validateArtifactPath(rawPath);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  return {
    modality,
    data: {
      path: validation.normalizedPath,
      location: payload.data?.location,
    },
  };
};

// Active Context Store (In-Memory)
let activeContext: ActiveContext | null = null;

const getActiveWhiteboard = (): string | null => {
  if (!activeContext || activeContext.modality !== 'whiteboard') {
    return null;
  }

  return activeContext.data.path;
};

app.post('/context/active', (req, res) => {
  try {
    activeContext = parseActiveContextBody(req.body);
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
  const { filePath } = req.body as { filePath?: unknown };
  if (filePath !== undefined) {
    try {
      const normalizedFilePath = requireNonEmptyString(filePath, 'filePath');
      const validation = validateArtifactPath(normalizedFilePath);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.reason });
      }
      activeContext = {
        modality: 'whiteboard',
        data: {
          path: validation.normalizedPath,
        },
      };
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

  console.log(`[HubServer] ✅ SSE client connected from ${req.ip}`);

  const onFileChanged = (event: { path: string; actor: string }) => {
    console.log(`[HubServer] ✅ Sending SSE event:`, { type: 'FILE_CHANGED', ...event });
    res.write(`data: ${JSON.stringify({ type: 'FILE_CHANGED', ...event })}\n\n`);
  };

  store.on('FILE_CHANGED', onFileChanged);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    console.log(`[HubServer] ❌ SSE client disconnected`);
    store.off('FILE_CHANGED', onFileChanged);
    clearInterval(heartbeat);
  });
});

// Internal API for MCP servers and Client

app.use(['/artifacts', '/files'], async (req, res, next) => {
  const isDeprecatedArtifactsRoute = req.baseUrl === '/artifacts';

  if (isDeprecatedArtifactsRoute) {
    res.setHeader('Warning', '299 - Deprecated endpoint. Use /files/:path instead.');
  }

  // Use req.path for file routing within the mount point
  const rawPath = req.path.startsWith('/') ? req.path.substring(1) : req.path;
  if (!rawPath || rawPath === '/') return next();

  if (req.method === 'POST') {
    const isPatchRequest = rawPath.endsWith('/patch');
    
    if (isPatchRequest) {
      const targetPath = rawPath.slice(0, -6);
      const v = validateArtifactPath(targetPath);
      if (!v.ok) return res.status(400).json({ error: v.reason });
      const filePath = v.normalizedPath;

      if (!filePath.endsWith('.diagram.json') && !filePath.endsWith('.deck.md')) {
        return res.status(400).json({ error: 'Patch only supported for .diagram.json or .deck.md files' });
      }
      const { patch } = req.body;
      if (!patch) return res.status(400).json({ error: 'Patch data is required' });

      try {
          const result = await patchEngine.apply(filePath, patch);
          return res.json({ success: true, version: result.version, bytes: result.bytes });
      } catch (error: any) {
          if (error.code === 'VERSION_CONFLICT' || error.code === 'UNSUPPORTED_PATCH_OPS') {
              return res.status(409).json({ error: error.reason, code: error.code, remediation: error.remediation });
          }
          return res.status(500).json({ error: error.message });
      }
    } else {
        const v = validateArtifactPath(rawPath);
        if (!v.ok) return res.status(400).json({ error: v.reason });
        const filePath = v.normalizedPath;
        const { content, opts, encoding } = req.body;
        
        // IF content is undefined, we might be hitting /patch without matching the suffix correctly?
        // Let's force an error if it's NOT /patch and missing content.
        if (content === undefined || content === null) {
            return res.status(400).json({ error: 'Content is required' });
        }

        try {
          let finalContent = content;
          if (encoding === 'base64') finalContent = Buffer.from(content, 'base64');
          await store.write(filePath, finalContent, opts as WriteOptions);
          return res.json({ success: true });
        } catch (error: any) {
          return res.status(500).json({ error: error.message });
        }
    }
  }

  // GET Handling
  const v = validateArtifactPath(rawPath);
  if (!v.ok) return res.status(400).json({ error: v.reason });
  const filePath = v.normalizedPath;

  if (req.method === 'GET') {
    try {
      const content = await store.read(filePath);
      res.send(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') res.status(404).json({ error: 'Artifact not found' });
      else res.status(500).json({ error: error.message });
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
