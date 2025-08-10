import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ProjectManager {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.cacheDir = path.resolve(this.rootDir, '_cache');
    fs.ensureDirSync(this.cacheDir);
    fs.ensureDirSync(this.rootDir);
  }

  async listProjects() {
    const entries = await fs.readdir(this.rootDir);
    const projects = [];
    for (const entry of entries) {
      const projectPath = path.join(this.rootDir, entry);
      const stats = await fs.stat(projectPath);
      if (stats.isDirectory()) {
        const meta = await this._readMeta(entry);
        projects.push({ id: entry, name: meta?.name || entry, createdAt: meta?.createdAt });
      }
    }
    return projects;
  }

  async createProject(name) {
    const id = uuidv4();
    const projectPath = path.join(this.rootDir, id);
    await fs.ensureDir(projectPath);
    await fs.ensureDir(path.join(projectPath, 'src'));
    const meta = { id, name, createdAt: new Date().toISOString() };
    await fs.writeJson(path.join(projectPath, 'project.json'), meta, { spaces: 2 });
    // Seed with a basic README and index.html
    await this.writeFile(id, 'README.md', `# ${name}\n\nGenerated project.`);
    await this.writeFile(id, 'src/index.html', `<!doctype html>\n<html><head><meta charset=\"utf-8\"/><title>${name}</title></head><body><h1>${name}</h1><div id=\"root\"></div></body></html>`);
    return meta;
  }

  async getProject(projectId) {
    return this._readMeta(projectId);
  }

  async _readMeta(projectId) {
    const metaPath = path.join(this.rootDir, projectId, 'project.json');
    if (!(await fs.pathExists(metaPath))) return null;
    return fs.readJson(metaPath);
  }

  async getProjectTree(projectId) {
    const base = path.join(this.rootDir, projectId);
    const walk = async (dir) => {
      const entries = await fs.readdir(dir);
      const result = [];
      for (const name of entries) {
        const full = path.join(dir, name);
        const rel = path.relative(base, full);
        const stats = await fs.stat(full);
        if (stats.isDirectory()) {
          result.push({ type: 'dir', name, path: rel, children: await walk(full) });
        } else {
          result.push({ type: 'file', name, path: rel });
        }
      }
      return result;
    };
    return walk(base);
  }

  async listFiles(projectId) {
    const base = path.join(this.rootDir, projectId);
    const files = [];
    const walk = async (dir) => {
      const entries = await fs.readdir(dir);
      for (const name of entries) {
        const full = path.join(dir, name);
        const rel = path.relative(base, full);
        const stats = await fs.stat(full);
        if (stats.isDirectory()) await walk(full);
        else files.push(rel);
      }
    };
    await walk(base);
    return files;
  }

  async readFile(projectId, filePath) {
    const projectPath = this._projectPath(projectId);
    const fullPath = path.join(projectPath, filePath);
    if (!(await fs.pathExists(fullPath))) {
      // Fallback to cache if not in project yet
      const cachePath = path.join(this.cacheDir, projectId, filePath);
      if (await fs.pathExists(cachePath)) {
        return await fs.readFile(cachePath, 'utf-8');
      }
      return '';
    }
    return await fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(projectId, filePath, content) {
    const projectPath = this._projectPath(projectId);
    const fullPath = path.join(projectPath, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content ?? '');
    // Persist a copy to cache for reuse
    const cachePath = path.join(this.cacheDir, projectId, filePath);
    await fs.ensureDir(path.dirname(cachePath));
    await fs.writeFile(cachePath, content ?? '');
    return true;
  }

  _sanitizeRelativePath(rel) {
    if (!rel || typeof rel !== 'string') return null;
    const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.includes('..')) return null;
    return normalized;
  }

  async getProjectSummary(projectId) {
    const projectPath = this._projectPath(projectId);
    const summary = { id: projectId, files: [], root: projectPath };
    const walk = async (dir) => {
      const entries = await fs.readdir(dir);
      for (const name of entries) {
        const full = path.join(dir, name);
        const rel = path.relative(projectPath, full).replace(/\\/g, '/');
        const stats = await fs.stat(full);
        if (stats.isDirectory()) await walk(full);
        else summary.files.push({ path: rel, bytes: stats.size });
      }
    };
    await walk(projectPath);
    return summary;
  }

  async ensurePreviewScaffold(projectId) {
    const projectPath = this._projectPath(projectId);
    const filePath = path.join(projectPath, 'src/index.html');
    if (await fs.pathExists(filePath)) return;
    await fs.ensureDir(path.dirname(filePath));
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Preview</title>
  <style>
    :root{--bg1:#eef2ff;--bg2:#e0f2fe;--bg3:#fae8ff;--fg:#0f172a;--muted:#475569;--accent:#2563eb;--accent2:#7c3aed}
    *{box-sizing:border-box} html,body{height:100%;margin:0}
    body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; color:var(--fg);
      background: linear-gradient(135deg,var(--bg1),var(--bg2),var(--bg3)); background-size: 200% 200%; animation:grad 12s ease infinite}
    @keyframes grad {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .container{max-width:960px;margin:0 auto;padding:24px}
    .hero{margin:12vh 0 6vh}
    .badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#ffffffa6;border:1px solid #e2e8f0;color:#334155;font-size:12px}
    h1{font-size:clamp(28px,6vw,56px);line-height:1.05;margin:16px 0 12px}
    p{font-size:clamp(14px,2.5vw,18px);color:var(--muted);max-width:60ch}
    .cta{margin-top:20px;display:flex;gap:12px;flex-wrap:wrap}
    .btn{padding:12px 16px;border-radius:12px;border:0;color:white;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 8px 30px -10px rgba(37,99,235,.6);text-decoration:none;font-weight:600}
    .btn.secondary{background:white;color:var(--fg);border:1px solid #e2e8f0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:48px}
    .card{background:#ffffffcc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;backdrop-filter:saturate(1.2) blur(6px)}
    code{background:#0f172a; color:#e2e8f0; padding:2px 6px; border-radius:6px}
  </style>
  </head>
<body>
  <div class="container">
    <div class="hero">
      <span class="badge">Project preview • mobile‑first</span>
      <h1>Build something amazing</h1>
      <p>This is a live preview placeholder. Once agents generate files (e.g., <code>src/index.html</code>, components, assets), they will appear here automatically.</p>
      <div class="cta">
        <a class="btn" href="#">Primary Action</a>
        <a class="btn secondary" href="#">Secondary</a>
      </div>
      <div class="grid">
        <div class="card"><strong>Tip:</strong> Upload your assets or let agents scaffold the UI.</div>
        <div class="card"><strong>Design:</strong> Gradient backdrop, bold typography, high contrast CTAs.</div>
        <div class="card"><strong>Next:</strong> Edit files via the editor and watch live updates.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    await fs.writeFile(filePath, html, 'utf-8');
  }

  _projectPath(projectId) {
    return path.join(this.rootDir, projectId);
  }
}

