import 'dotenv/config';
import './tracing.js';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import chokidar from 'chokidar';
import { ProjectManager } from './utils/projectManager.js';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import client from 'prom-client';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import simpleGit from 'simple-git';
import { Octokit } from '@octokit/rest';
// Defer orchestrator import to avoid startup failures if agents have issues
let orchestrator = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.RATE_LIMIT_MAX || 120),
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: process.env.BODY_LIMIT || '5mb' }));
// Avoid caches on API endpoints
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT ? Number(process.env.WEBSOCKET_PORT) : undefined;

const projectsRoot = process.env.PROJECTS_DIR
  ? path.resolve(process.env.PROJECTS_DIR)
  : path.resolve(__dirname, '../projects');
const projectManager = new ProjectManager(projectsRoot);
// S3 client if configured
const s3Client = process.env.S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new S3Client({ region: process.env.AWS_REGION })
  : null;
// Prometheus metrics
const collectDefault = client.collectDefaultMetrics;
collectDefault();
const msgCounter = new client.Counter({ name: 'agent_messages_total', help: 'Total agent messages processed', labelNames: ['agent', 'status'] });
const taskDuration = new client.Histogram({ name: 'agent_task_duration_ms', help: 'Task duration in ms', buckets: [100, 300, 500, 1000, 3000, 5000, 10000] });
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

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Simple OpenAI key validation (does not consume significant tokens)
app.get('/api/validate/openai', async (_req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ ok: false, error: 'OPENAI_API_KEY not set' });
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });
    // List models as a lightweight check
    const models = await client.models.list();
    const hasAny = Array.isArray(models?.data) && models.data.length > 0;
    return res.json({ ok: true, models: hasAny ? models.data.slice(0, 3).map((m) => m.id) : [] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Unknown error' });
  }
});

app.get('/api/projects', async (_req, res) => {
  const projects = await projectManager.listProjects();
  res.json(projects);
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body || {};
  const project = await projectManager.createProject(name || `project-${uuidv4().slice(0, 8)}`);
  await projectManager.ensurePreviewScaffold(project.id);
  res.json(project);
});

app.get('/api/projects/:projectId', async (req, res) => {
  const project = await projectManager.getProject(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  await projectManager.ensurePreviewScaffold(project.id);
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

// Git push: initialize (if needed) and push to remote
app.post('/api/projects/:projectId/git/push', async (req, res) => {
  try {
    const remote = (req.body && req.body.remote) || process.env.GIT_REMOTE;
    const branch = (req.body && req.body.branch) || 'main';
    const message = (req.body && req.body.message) || 'Update from AI Dev Platform';
    if (!remote) return res.status(400).json({ error: 'remote required (env GIT_REMOTE or body.remote)' });
    const projectPath = path.join(projectManager.rootDir, req.params.projectId);
    const git = simpleGit({ baseDir: projectPath });
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      await git.init();
      await git.add('.');
      await git.commit(message || 'Initial commit from AI Dev Platform');
      await git.addRemote('origin', remote).catch(() => {});
    } else {
      await git.add('.');
      await git.commit(message);
      const remotes = await git.getRemotes(true);
      if (!remotes.find((r) => r.name === 'origin')) {
        await git.addRemote('origin', remote);
      }
    }
    await git.push('origin', branch).catch(async () => {
      // Create main if it doesn't exist
      await git.checkoutLocalBranch(branch);
      await git.push(['-u', 'origin', branch]);
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'git push failed' });
  }
});

// Create PR (optional): requires GITHUB_TOKEN, repo (owner/name), and branch
app.post('/api/projects/:projectId/git/pr', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN || req.body?.token;
    const repo = req.body?.repo; // e.g. "owner/name"
    const branch = req.body?.branch || 'main';
    const base = req.body?.base || 'main';
    const title = req.body?.title || 'AI Dev Platform changes';
    if (!token || !repo) return res.status(400).json({ error: 'GITHUB_TOKEN and repo required' });
    const [owner, name] = String(repo).split('/');
    const octokit = new Octokit({ auth: token });
    const pr = await octokit.pulls.create({ owner, repo: name, head: branch, base, title });
    res.json({ ok: true, url: pr.data.html_url });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'pr failed' });
  }
});

// Scaffold: Next.js Web + Expo Mobile monorepo (Turborepo)
app.post('/api/projects/:projectId/scaffold/monorepo', async (req, res) => {
  const projectId = String(req.params.projectId);
  try {
    // Root files
    const rootPkg = `{
  "name": "novacode",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:web": "turbo run dev --filter=web",
    "dev:mobile": "turbo run start --filter=mobile",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.3"
  }
}`;
    const turbo = `{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false },
    "start": { "cache": false },
    "lint": {}
  }
}`;
    const readme = `# NovaCode Monorepo (Next.js + Expo)

Apps:
- apps/web (Next.js)
- apps/mobile (Expo)

Packages:
- packages/ui (shared React/React Native components using react-native-web)
- packages/shared (shared TS utilities)

Dev:
- pnpm install
- pnpm dev:web  # Next.js
- pnpm dev:mobile # Expo (QR + device)
`;
    await projectManager.writeFile(projectId, 'monorepo/package.json', rootPkg);
    await projectManager.writeFile(projectId, 'monorepo/turbo.json', turbo);
    await projectManager.writeFile(projectId, 'monorepo/README.md', readme);

    // apps/web (Next.js 14 app router)
    const webPkg = `{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 5173",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}`;
    const nextCfg = `/** @type {import('next').NextConfig} */
const nextConfig = { experimental: { appDir: true } };
export default nextConfig;`;
    const webLayout = `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}`;
    const webPage = `export default function Page() {
  return (
    <main style={{padding:24,fontFamily:'ui-sans-serif'}}> 
      <h1>NovaCode (Next.js)</h1>
      <p>Generated monorepo: apps/web + apps/mobile</p>
    </main>
  );
}`;
    await projectManager.writeFile(projectId, 'monorepo/apps/web/package.json', webPkg);
    await projectManager.writeFile(projectId, 'monorepo/apps/web/next.config.mjs', nextCfg);
    await projectManager.writeFile(projectId, 'monorepo/apps/web/app/layout.tsx', webLayout);
    await projectManager.writeFile(projectId, 'monorepo/apps/web/app/page.tsx', webPage);

    // apps/mobile (Expo)
    const mobilePkg = `{
  "name": "mobile",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": { "start": "expo start", "android": "expo run:android", "ios": "expo run:ios", "web": "expo start --web" },
  "dependencies": {
    "expo": "^51.0.0",
    "expo-router": "^3.5.16",
    "react": "^18.2.0",
    "react-native": "0.74.2"
  }
}`;
    const appJson = `{
  "expo": {
    "name": "NovaCode",
    "slug": "novacode-mobile",
    "sdkVersion": "51.0.0",
    "plugins": ["expo-router"],
    "extra": { "router": { "origin": "expo" } }
  }
}`;
    const layout = `import { Stack } from 'expo-router';
export default function Layout(){ return <Stack /> }`;
    const mobileIndex = `import { Text, View } from 'react-native';
export default function Home(){
  return (<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>NovaCode (Expo)</Text></View>);
}`;
    await projectManager.writeFile(projectId, 'monorepo/apps/mobile/package.json', mobilePkg);
    await projectManager.writeFile(projectId, 'monorepo/apps/mobile/app.json', appJson);
    await projectManager.writeFile(projectId, 'monorepo/apps/mobile/app/_layout.tsx', layout);
    await projectManager.writeFile(projectId, 'monorepo/apps/mobile/app/index.tsx', mobileIndex);

    // packages/ui
    const uiPkg = `{
  "name": "@novacode/ui",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": { "build": "tsc -p tsconfig.json" },
  "devDependencies": { "typescript": "^5.4.5" }
}`;
    const uiIndex = `export { Button } from './Button';`;
    const uiButton = `import React from 'react';
export function Button({ children }: { children: React.ReactNode }) { return <button style={{padding:8,borderRadius:8}}>{children}</button>; }`;
    await projectManager.writeFile(projectId, 'monorepo/packages/ui/package.json', uiPkg);
    await projectManager.writeFile(projectId, 'monorepo/packages/ui/tsconfig.json', '{"compilerOptions":{"declaration":true,"outDir":"dist","jsx":"react-jsx","module":"ESNext","target":"ES2020","moduleResolution":"Bundler"}}');
    await projectManager.writeFile(projectId, 'monorepo/packages/ui/src/index.ts', uiIndex);
    await projectManager.writeFile(projectId, 'monorepo/packages/ui/src/Button.tsx', uiButton);

    // packages/shared
    const sharedPkg = `{
  "name": "@novacode/shared",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": { "build": "tsc -p tsconfig.json" },
  "devDependencies": { "typescript": "^5.4.5" }
}`;
    await projectManager.writeFile(projectId, 'monorepo/packages/shared/package.json', sharedPkg);
    await projectManager.writeFile(projectId, 'monorepo/packages/shared/tsconfig.json', '{"compilerOptions":{"declaration":true,"outDir":"dist","module":"ESNext","target":"ES2020","moduleResolution":"Bundler"}}');
    await projectManager.writeFile(projectId, 'monorepo/packages/shared/src/index.ts', 'export const version = "0.1.0";');

    // CI/Deploy hints
    await projectManager.writeFile(projectId, 'monorepo/.github/workflows/ci.yml', `name: CI\n'on': [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: pnpm/action-setup@v3\n        with: { version: 8 }\n      - uses: actions/setup-node@v4\n        with: { node-version: 18, cache: 'pnpm' }\n      - run: pnpm install\n      - run: pnpm build\n`);
    await projectManager.writeFile(projectId, 'monorepo/eas.json', `{"cli": {"version": ">= 11.0.0"}, "build": {"production": {"android": {"buildType": "apk"}, "ios": {"simulator": true}}}}`);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'scaffold failed' });
  }
});

// Upload files (multipart/form-data)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024) } });
app.post('/api/projects/:projectId/upload', upload.array('files'), async (req, res) => {
  const baseDir = typeof req.body?.baseDir === 'string' ? req.body.baseDir : '';
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return res.status(400).json({ error: 'no files' });
  for (const f of files) {
    const safeName = String(f.originalname).replace(/\\/g, '/').replace(/^\.+/, '');
    const relPath = baseDir ? `${baseDir}/${safeName}` : safeName;
    await projectManager.writeFile(req.params.projectId, relPath, f.buffer.toString('utf-8'));
    if (s3Client) {
      const key = `${req.params.projectId}/${relPath}`;
      await s3Client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: f.buffer }));
    }
  }
  res.json({ ok: true, uploaded: files.map((f) => f.originalname) });
});

// Download from S3 if available
app.get('/api/projects/:projectId/s3/:key(*)', async (req, res) => {
  if (!s3Client) return res.status(400).json({ error: 'S3 not configured' });
  const key = `${req.params.projectId}/${req.params.key}`;
  const obj = await s3Client.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
  res.set('Content-Type', obj.ContentType || 'application/octet-stream');
  obj.Body.pipe(res);
});

// Serve frontend build if present (for production/preview)
const staticDir = path.resolve(__dirname, './public');
app.use(express.static(staticDir));
// Fallback: serve index.html if exists; otherwise show hint
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.path.startsWith('/preview/')) return next();
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
if (WEBSOCKET_PORT && WEBSOCKET_PORT !== PORT) {
  wss = new WebSocketServer({ port: WEBSOCKET_PORT });
  console.log(`WebSocket listening on ws://localhost:${WEBSOCKET_PORT}`);
} else {
  wss = new WebSocketServer({ server: httpServer });
  console.log(`WebSocket attached to HTTP server on port ${PORT}`);
}
const clients = new Map();
// WS backpressure: coalesce bursts
const pendingBatches = new Map();
function sendBatched(ws, payload) {
  const key = ws;
  const existing = pendingBatches.get(key) || [];
  existing.push(payload);
  pendingBatches.set(key, existing);
}
setInterval(() => {
  for (const [ws, arr] of pendingBatches.entries()) {
    if (ws.readyState === ws.OPEN && arr.length) {
      ws.send(JSON.stringify({ type: 'batch', items: arr.splice(0, arr.length) }));
    }
    if (!arr.length) pendingBatches.delete(ws);
  }
}, 150);

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
          if (ws.readyState === ws.OPEN) sendBatched(ws, { type: 'agent_update', ...update });
          const end = taskDuration.startTimer();
          if (update.status === 'completed' || update.status === 'error') end();
          if (update.agent) msgCounter.inc({ agent: update.agent, status: update.status || 'info' });
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
    if (ws.readyState === ws.OPEN) sendBatched(ws, payload);
  }
});

// Static preview route for project files
app.get('/preview/:projectId/*', async (req, res) => {
  try {
    const rel = req.params[0] || '';
    const filePath = path.join(projectManager.rootDir, req.params.projectId, rel);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    res.sendFile(filePath);
  } catch (e) {
    res.status(500).send('Error');
  }
});

