import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import chokidar from 'chokidar';
import { ProjectManager } from './utils/projectManager.js';
// Defer orchestrator import to avoid startup failures if agents have issues
let orchestrator = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT ? Number(process.env.WEBSOCKET_PORT) : undefined;

const projectsRoot = process.env.PROJECTS_DIR
  ? path.resolve(process.env.PROJECTS_DIR)
  : path.resolve(__dirname, '../projects');
const projectManager = new ProjectManager(projectsRoot);
async function getOrchestrator() {
  if (!orchestrator) {
    const mod = await import('./agents/orchestrator.js');
    orchestrator = new mod.AgentOrchestrator({ projectManager });
  }
  return orchestrator;
}

// API routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/projects', async (_req, res) => {
  const projects = await projectManager.listProjects();
  res.json(projects);
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body || {};
  const project = await projectManager.createProject(name || `project-${uuidv4().slice(0, 8)}`);
  res.json(project);
});

app.get('/api/projects/:projectId', async (req, res) => {
  const project = await projectManager.getProject(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

app.get('/api/projects/:projectId/tree', async (req, res) => {
  const tree = await projectManager.getProjectTree(req.params.projectId);
  res.json(tree);
});

app.get('/api/projects/:projectId/files', async (req, res) => {
  const files = await projectManager.listFiles(req.params.projectId);
  res.json(files);
});

app.get('/api/projects/:projectId/file', async (req, res) => {
  const { filePath } = req.query;
  if (!filePath || typeof filePath !== 'string') return res.status(400).json({ error: 'filePath required' });
  const content = await projectManager.readFile(req.params.projectId, filePath);
  res.json({ filePath, content });
});

app.post('/api/projects/:projectId/file', async (req, res) => {
  const { filePath, content } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  await projectManager.writeFile(req.params.projectId, filePath, content ?? '');
  res.json({ ok: true });
});

// Serve frontend build if present (for production/preview)
const staticDir = path.resolve(__dirname, './public');
app.use(express.static(staticDir));
// Fallback: serve index.html if exists; otherwise show hint
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(staticDir, 'index.html');
  fs.access(indexPath, (err) => {
    if (!err) return res.sendFile(indexPath);
    return res.status(200).send('Backend is running. In development use http://localhost:5173 for the frontend.');
  });
});

const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP listening on http://0.0.0.0:${PORT}`);
});

// WebSocket server for real-time updates
let wss;
if (WEBSOCKET_PORT) {
  wss = new WebSocketServer({ port: WEBSOCKET_PORT });
  console.log(`WebSocket listening on ws://localhost:${WEBSOCKET_PORT}`);
} else {
  wss = new WebSocketServer({ server: httpServer });
  console.log(`WebSocket attached to HTTP server on port ${PORT}`);
}
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  ws.send(JSON.stringify({ type: 'connected', clientId }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(String(data));
      if (message?.type === 'user_message') {
        const { text, projectId } = message;
        const updateCallback = (update) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'agent_update', ...update }));
          }
        };
        const orch = await getOrchestrator();
        await orch.processUserMessage(String(text || ''), String(projectId || ''), updateCallback);
      }
    } catch (err) {
      console.error('WS message error', err);
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'agent_update',
            id: `orchestrator-${Date.now()}`,
            agent: 'orchestrator',
            status: 'error',
            message: err?.message || 'Unknown error',
          })
        );
      }
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
  });
});

// Watch project files and broadcast changes
const watcher = chokidar.watch(projectManager.rootDir, { ignoreInitial: true });
watcher.on('all', async (event, filePath) => {
  const relative = path.relative(projectManager.rootDir, filePath);
  const [projectId, ...rest] = relative.split(path.sep);
  const projectRelativePath = rest.join('/');
  const payload = {
    type: 'file_event',
    event,
    projectId,
    filePath: projectRelativePath,
  };
  for (const ws of clients.values()) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
  }
});

