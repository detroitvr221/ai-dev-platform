"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { FileExplorer } from '../components/FS/FileExplorer';
import { CodeMirrorPane } from '../components/Editor/CodeMirrorPane';
import { PreviewPane, buildPreviewHtml } from '../components/Preview/PreviewPane';
import { AgentChat } from '../components/chat/AgentChat';
import { langFromPath } from '../lib/languageByExtension';
import { loadState, saveState } from '../lib/persistence';

type FileMap = Record<string, { content: string; language: string }>;

export default function Page(){
  const [files, setFiles] = useState<FileMap>({
    '/index.html': { content: '<!doctype html>\n<html>\n<head><meta charset="UTF-8"/><title>App</title></head>\n<body>\n<div id="app">Hello World</div>\n</body>\n</html>', language: 'html' },
    '/styles.css': { content: 'body{font-family: ui-sans-serif; padding:16px}', language: 'css' },
    '/main.js': { content: 'document.getElementById("app").textContent = "Hello from JS"', language: 'javascript' },
    '/package.json': { content: JSON.stringify({ name: 'novacode-next', version: '0.1.0', dependencies: {}, devDependencies: {} }, null, 2), language: 'json' },
  });
  const [activePath, setActivePath] = useState<string>('/index.html');
  const [view, setView] = useState<'code'|'preview'>('code');
  const html = useMemo(()=>buildPreviewHtml(files), [files]);

  const onNew = () => {
    const name = prompt('New file path', '/new.js');
    if (!name) return;
    const lang = langFromPath(name);
    setFiles((prev)=> ({ ...prev, [name]: { content: '', language: lang } }));
    setActivePath(name);
  };
  const onMove = (from: string, to: string) => {
    setFiles((prev) => {
      const next: FileMap = { ...prev }; next[to] = prev[from]; delete next[from]; return next;
    });
    if (activePath === from) setActivePath(to);
  };
  const entries = Object.keys(files).sort();

  // hydrate from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadState();
        if (loaded) {
          setFiles(loaded.files);
          setActivePath(loaded.activePath);
        }
      } catch {}
    })();
  }, []);

  // persist to IndexedDB
  useEffect(() => {
    (async () => {
      try {
        await saveState({ files, activePath });
      } catch {}
    })();
  }, [files, activePath]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <div className="flex-1 min-h-0 flex">
        <FileExplorer files={entries} activePath={activePath} onOpen={setActivePath} onNew={onNew} onMove={onMove} />
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-3 py-2 border-b text-xs flex items-center gap-2">
            <button className={`px-2 py-1 rounded ${view==='code'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setView('code')}>Code</button>
            <button className={`px-2 py-1 rounded ${view==='preview'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setView('preview')}>Preview</button>
            <span className="text-slate-500 ml-auto text-[11px]">Next.js demo</span>
          </div>
          {view==='code' ? (
            <CodeMirrorPane path={activePath} value={files[activePath]?.content || ''} onChange={(v)=>setFiles((prev)=> ({...prev, [activePath]: { ...prev[activePath], content: v } }))} />
          ) : (
            <PreviewPane html={html} />
          )}
        </div>
      </div>
      <AgentChat />
    </div>
  );
}


