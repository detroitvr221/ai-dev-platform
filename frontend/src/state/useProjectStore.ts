import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { persistProjectState, loadProjectState } from './persistence';
import { getLanguageByExtension } from '../utils/languageByExtension';
import { joinPath, dirname, basename } from '../utils/path';

export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
};

export type OpenTab = {
  id: string;
  path: string;
  name: string;
  language: string;
  dirty: boolean;
};

export type ProjectState = {
  tree: FileNode[];
  openTabs: OpenTab[];
  activeTabId?: string;
  filesByPath: Record<string, { content: string; language: string }>; 
  packageJson: { name: string; version: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  lastSavedAt: number;
};

export type ProjectStore = ProjectState & {
  hydrate: () => Promise<void>;
  resetProject: () => Promise<void>;
  saveAll: () => Promise<void>;
  createFile: (path: string, content?: string) => void;
  createFolder: (path: string) => void;
  renamePath: (oldPath: string, newPath: string) => void;
  deletePath: (path: string) => void;
  openFile: (path: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId?: string) => void;
  updateFileContent: (path: string, content: string) => void;
  setPackageJson: (updater: (pkg: ProjectState['packageJson']) => ProjectState['packageJson']) => void;
};

const SEED_FILES: Record<string, string> = {
  '/index.html': `<!doctype html>\n<html>\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Monaco No-code Editor</title>\n  </head>\n  <body>\n    <div id="app">Hello world</div>\n    <script src="/main.js"></script>\n  </body>\n</html>\n`,
  '/styles.css': `body{font-family: system-ui, -apple-system, sans-serif; padding: 16px;}`,
  '/main.js': `document.getElementById('app').textContent = 'Hello from JS';`,
  '/package.json': JSON.stringify({ name: 'monaco-no-code', version: '0.1.0', dependencies: {}, devDependencies: {} }, null, 2),
};

function buildTreeFromFiles(filesByPath: ProjectState['filesByPath']): FileNode[] {
  const root: FileNode = { id: 'root', name: '/', type: 'folder', path: '/', children: [] };
  const ensureFolder = (folderPath: string): FileNode => {
    const parts = folderPath.split('/').filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const subPath = '/' + parts.slice(0, i + 1).join('/');
      let child = current.children!.find((c) => c.type === 'folder' && c.path === subPath);
      if (!child) {
        child = { id: nanoid(), name: parts[i], type: 'folder', path: subPath, children: [] };
        current.children!.push(child);
      }
      current = child;
    }
    return current;
  };
  Object.keys(filesByPath).forEach((path) => {
    if (path === '/') return;
    const dir = dirname(path);
    const parent = ensureFolder(dir);
    parent.children!.push({ id: nanoid(), name: basename(path), type: 'file', path });
  });
  return root.children || [];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  tree: [],
  openTabs: [],
  activeTabId: undefined,
  filesByPath: {},
  packageJson: { name: 'monaco-no-code', version: '0.1.0', dependencies: {}, devDependencies: {} },
  lastSavedAt: 0,

  hydrate: async () => {
    const loaded = await loadProjectState();
    if (loaded) {
      set({ ...loaded });
    } else {
      // seed
      const files: ProjectState['filesByPath'] = {};
      Object.entries(SEED_FILES).forEach(([p, c]) => {
        files[p] = { content: c, language: getLanguageByExtension(p) };
      });
      const pkg = JSON.parse(SEED_FILES['/package.json']);
      const state: ProjectState = {
        filesByPath: files,
        tree: buildTreeFromFiles(files),
        openTabs: [],
        activeTabId: undefined,
        packageJson: pkg,
        lastSavedAt: Date.now(),
      };
      set(state);
      await persistProjectState(state);
    }
  },

  resetProject: async () => {
    const files: ProjectState['filesByPath'] = {};
    Object.entries(SEED_FILES).forEach(([p, c]) => {
      files[p] = { content: c, language: getLanguageByExtension(p) };
    });
    const pkg = JSON.parse(SEED_FILES['/package.json']);
    set({
      filesByPath: files,
      tree: buildTreeFromFiles(files),
      openTabs: [],
      activeTabId: undefined,
      packageJson: pkg,
      lastSavedAt: Date.now(),
    });
    const s = get();
    await persistProjectState({
      tree: s.tree,
      openTabs: s.openTabs,
      activeTabId: s.activeTabId,
      filesByPath: s.filesByPath,
      packageJson: s.packageJson,
      lastSavedAt: s.lastSavedAt,
    });
  },

  saveAll: async () => {
    set({ lastSavedAt: Date.now() });
    const s = get();
    await persistProjectState({
      tree: s.tree,
      openTabs: s.openTabs,
      activeTabId: s.activeTabId,
      filesByPath: s.filesByPath,
      packageJson: s.packageJson,
      lastSavedAt: s.lastSavedAt,
    });
  },

  createFile: (path, content = '') => {
    const language = getLanguageByExtension(path);
    const filesByPath = { ...get().filesByPath, [path]: { content, language } };
    const tree = buildTreeFromFiles(filesByPath);
    set({ filesByPath, tree });
  },

  createFolder: (path) => {
    // Folders are implicit in tree; nothing to add to filesByPath
    const tree = buildTreeFromFiles(get().filesByPath);
    // Ensure folder node exists by creating a placeholder removal step
    const parts = path.split('/').filter(Boolean);
    if (parts.length) {
      // no-op; tree builder ensures folders when files are created later
      set({ tree });
    }
  },

  renamePath: (oldPath, newPath) => {
    const files = get().filesByPath;
    const updated: ProjectState['filesByPath'] = {};
    Object.entries(files).forEach(([p, v]) => {
      if (p === oldPath || p.startsWith(oldPath + '/')) {
        const replaced = p.replace(oldPath, newPath);
        updated[replaced] = v;
      } else {
        updated[p] = v;
      }
    });
    set({ filesByPath: updated, tree: buildTreeFromFiles(updated) });
  },

  deletePath: (path) => {
    const files = get().filesByPath;
    const updated: ProjectState['filesByPath'] = {};
    Object.entries(files).forEach(([p, v]) => {
      if (p === path || p.startsWith(path + '/')) return;
      updated[p] = v;
    });
    set({ filesByPath: updated, tree: buildTreeFromFiles(updated) });
  },

  openFile: (path) => {
    const { filesByPath, openTabs } = get();
    const existing = openTabs.find((t) => t.path === path);
    const id = existing?.id || nanoid();
    const name = basename(path);
    const language = filesByPath[path]?.language || getLanguageByExtension(path);
    const newTab: OpenTab = existing || { id, path, name, language, dirty: false };
    const nextTabs = existing ? openTabs : [...openTabs, newTab];
    set({ openTabs: nextTabs, activeTabId: newTab.id });
  },

  closeTab: (tabId) => {
    const { openTabs, activeTabId } = get();
    const next = openTabs.filter((t) => t.id !== tabId);
    const nextActive = activeTabId === tabId ? next[next.length - 1]?.id : activeTabId;
    set({ openTabs: next, activeTabId: nextActive });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateFileContent: (path, content) => {
    const { filesByPath, openTabs } = get();
    const prev = filesByPath[path];
    const language = prev?.language || getLanguageByExtension(path);
    const changed = { ...filesByPath, [path]: { content, language } };
    const nextTabs = openTabs.map((t) => (t.path === path ? { ...t, dirty: true } : t));
    set({ filesByPath: changed, openTabs: nextTabs });
  },

  setPackageJson: (updater) => {
    const next = updater(get().packageJson);
    set({ packageJson: next, filesByPath: { ...get().filesByPath, '/package.json': { content: JSON.stringify(next, null, 2), language: 'json' } } });
  },
}));


