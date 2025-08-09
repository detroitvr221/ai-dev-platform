import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ProjectManager {
  constructor(rootDir) {
    this.rootDir = rootDir;
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
    const fullPath = path.join(this.rootDir, projectId, filePath);
    if (!(await fs.pathExists(fullPath))) return '';
    return fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(projectId, filePath, content) {
    const safe = this._sanitizeRelativePath(filePath);
    if (!safe) throw new Error(`Invalid file path: ${filePath}`);
    const fullPath = path.join(this.rootDir, projectId, safe);
    await fs.ensureDir(path.dirname(fullPath));
    const maxBytes = Number(process.env.MAX_FILE_WRITE_BYTES || 2 * 1024 * 1024); // 2MB default
    const buffer = Buffer.from(String(content ?? ''), 'utf-8');
    if (buffer.byteLength > maxBytes) throw new Error(`File too large (${buffer.byteLength} bytes)`);
    await fs.writeFile(fullPath, buffer);
    return true;
  }

  _sanitizeRelativePath(rel) {
    if (!rel || typeof rel !== 'string') return null;
    const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.includes('..')) return null;
    return normalized;
  }

  async getProjectSummary(projectId) {
    const base = path.join(this.rootDir, projectId);
    const files = [];
    const walk = async (dir) => {
      const entries = await fs.readdir(dir);
      for (const name of entries) {
        const full = path.join(dir, name);
        const rel = path.relative(base, full).replace(/\\/g, '/');
        const stats = await fs.stat(full);
        if (stats.isDirectory()) await walk(full);
        else files.push({ path: rel, bytes: stats.size });
      }
    };
    await walk(base);
    return { files };
  }
}

