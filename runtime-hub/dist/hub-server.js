import express from 'express';
import { ArtifactStore } from './services/ArtifactStore.js';
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
    }
    else {
        next();
    }
});
const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, '../../');
const store = new ArtifactStore(projectRoot);
const designRoot = path.join(projectRoot, 'design');
const now = () => new Date().toISOString();
const ACTIVE_MODALITIES = ['drawing', 'editor', 'whiteboard'];
const logDesignDir = (status, meta) => {
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
    }
    catch (error) {
        logDesignDir('failure', {
            designRoot,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};
const validateArtifactPath = (rawPath) => {
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
const requireNonEmptyString = (value, fieldName) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${fieldName} is required`);
    }
    return value;
};
const parseActiveContextBody = (body) => {
    if (!body || typeof body !== 'object') {
        throw new Error('Request body is required');
    }
    const payload = body;
    const modality = requireNonEmptyString(payload.modality, 'modality');
    const filePath = requireNonEmptyString(payload.filePath, 'filePath');
    if (!ACTIVE_MODALITIES.includes(modality)) {
        throw new Error(`modality must be one of: ${ACTIVE_MODALITIES.join(', ')}`);
    }
    const validation = validateArtifactPath(filePath);
    if (!validation.ok) {
        throw new Error(validation.reason);
    }
    return {
        modality: modality,
        filePath: validation.normalizedPath,
        timestamp: now(),
    };
};
// Active Context Store (In-Memory)
let activeContext = null;
const getActiveWhiteboard = () => {
    if (!activeContext || activeContext.modality !== 'whiteboard') {
        return null;
    }
    return activeContext.filePath;
};
app.post('/context/active', (req, res) => {
    try {
        activeContext = parseActiveContextBody(req.body);
        console.log('[HubServer] Active context set', { ...activeContext, ts: now() });
        res.json({ success: true, activeContext });
    }
    catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
app.get('/context/active', (req, res) => {
    res.json(activeContext);
});
app.post('/context/active-whiteboard', (req, res) => {
    const { filePath } = req.body;
    if (filePath !== undefined) {
        try {
            const normalizedFilePath = requireNonEmptyString(filePath, 'filePath');
            const validation = validateArtifactPath(normalizedFilePath);
            if (!validation.ok) {
                return res.status(400).json({ error: validation.reason });
            }
            activeContext = {
                modality: 'whiteboard',
                filePath: validation.normalizedPath,
                timestamp: now(),
            };
            console.log('[HubServer] Active whiteboard set', { filePath: activeContext.filePath, ts: now() });
        }
        catch (error) {
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
    const onFileChanged = (event) => {
        res.write(`data: ${JSON.stringify({ type: 'FILE_CHANGED', ...event })}\n\n`);
    };
    store.on('FILE_CHANGED', onFileChanged);
    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);
    req.on('close', () => {
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
            const content = await store.read(filePath);
            res.send(content);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ error: 'Artifact not found' });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    else if (req.method === 'POST') {
        const { content, opts, encoding } = req.body;
        if (content === undefined || content === null) {
            return res.status(400).json({ error: 'Content is required' });
        }
        try {
            let finalContent = content;
            if (encoding === 'base64') {
                finalContent = Buffer.from(content, 'base64');
            }
            await store.write(filePath, finalContent, opts);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    else {
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
