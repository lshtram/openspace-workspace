import express from 'express';
import { ArtifactStore, WriteOptions } from './services/ArtifactStore.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Internal API for MCP servers and Client
app.get('/artifacts/*', async (req, res) => {
  const filePath = (req.params as any)[0];
  try {
    const content = await store.read(filePath);
    res.send(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Artifact not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/artifacts/*', async (req, res) => {
  const filePath = (req.params as any)[0];
  const { content, opts, encoding } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    let finalContent = content;
    if (encoding === 'base64') {
      finalContent = Buffer.from(content, 'base64');
    }
    
    await store.write(filePath, finalContent, opts as WriteOptions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.HUB_PORT || 3001;
app.listen(PORT, () => {
  console.log(`[HubServer] Internal API listening on port ${PORT}`);
});
