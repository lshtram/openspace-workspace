import express from 'express';
import { ArtifactStore, WriteOptions } from './services/ArtifactStore.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, '../../');
const store = new ArtifactStore(projectRoot);

// Internal API for MCP servers
app.get('/artifacts/*path', async (req, res) => {
  const filePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
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

app.post('/artifacts/*path', async (req, res) => {
  const filePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
  const { content, opts } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    await store.write(filePath, content, opts as WriteOptions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.HUB_PORT || 3001;
app.listen(PORT, () => {
  console.log(`[HubServer] Internal API listening on port ${PORT}`);
});
