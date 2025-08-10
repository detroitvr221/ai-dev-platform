import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';

type FileMap = Record<string, { content: string; language: string }>

function langExtensions(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return [html({ autoCloseTags: true })];
    case 'css': return [css()];
    case 'json': return [json()];
    default: return [javascript({ jsx: false, typescript: false })];
  }
}

function buildSrcDoc(files: FileMap): string {
  const indexHtml = files['/index.html']?.content || '';
  const cssText = Object.entries(files).filter(([p])=>p.endsWith('.css')).map(([,v])=>v.content).join('\n');
  const jsText = Object.entries(files).filter(([p])=>p.endsWith('.js')).map(([,v])=>v.content).join('\n');
  let base = indexHtml || `<!doctype html>\n<html>\n<head>\n<meta charset="UTF-8"/><title>Preview</title>\n</head>\n<body>\n<div id="app">Hello</div>\n</body>\n</html>`;
  base = base.replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '').replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  base = base.replace(/<head(\s*)>/i, `<head$1>\n<style>\n${cssText}\n<\/style>`);
  base = base.replace(/<\/body>/i, `<script>\n${jsText}\n<\/script></body>`);
  return base;
}

export function App() {
  const [files, setFiles] = useState<FileMap>({
    '/index.html': { content: '<!doctype html>\n<html>\n<head><meta charset="UTF-8"/><title>App</title></head>\n<body>\n<div id="app">Hello World</div>\n</body>\n</html>', language: 'html' },
    '/styles.css': { content: 'body{font-family: ui-sans-serif; padding:16px}', language: 'css' },
    '/main.js': { content: 'document.getElementById("app").textContent = "Hello from JS"', language: 'javascript' },
    '/package.json': { content: JSON.stringify({ name: 'novacode', version: '0.1.0', dependencies: {}, devDependencies: {} }, null, 2), language: 'json' },
  });
  const [activePath, setActivePath] = useState<string>('/index.html');
  const [view, setView] = useState<'code'|'preview'>('code');
  const [projectId, setProjectId] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chat, setChat] = useState<Array<{ role: 'user'|'agent'; text: string }>>([]);

  const srcdoc = useMemo(() => buildSrcDoc(files), [files]);

  const onChange = (value: string) => setFiles((prev) => ({ ...prev, [activePath]: { ...prev[activePath], content: value } }));

  const entries = Object.keys(files).sort();

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('./persistence');
        const loaded = await mod.loadState();
        if (loaded) {
          setFiles(loaded.files);
          setActivePath(loaded.activePath);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const mod = await import('./persistence');
        await mod.saveState({ files, activePath });
      } catch {}
    })();
  }, [files, activePath]);

  // Ensure a project exists for AI chat
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects', { cache: 'no-store' });
        let list = await res.json();
        if (!Array.isArray(list) || list.length === 0) {
          const created = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'simple' }) });
          const pj = await created.json();
          setProjectId(pj.id);
        } else {
          setProjectId(list[0].id);
        }
      } catch {
        setProjectId('');
      }
    })();
  }, []);

  // WebSocket chat attach
  useEffect(() => {
    let socket: WebSocket | null = null;
    const open = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${window.location.host}`;
      socket = new WebSocket(url);
      setWs(socket);
      socket.onopen = () => setConnected(true);
      socket.onclose = () => setConnected(false);
      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'batch' && Array.isArray(msg.items)) {
            for (const it of msg.items) {
              if (it.type === 'agent_update' && it.message) setChat((c)=>[...c, { role: 'agent', text: String(it.message) }]);
            }
            return;
          }
          if (msg.type === 'agent_update' && msg.message) setChat((c)=>[...c, { role: 'agent', text: String(msg.message) }]);
        } catch {}
      };
    };
    open();
    return () => { try { socket?.close(); } catch {} };
  }, []);

  const sendChat = () => {
    if (!chatInput.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    const payload = { type: 'user_message', text: chatInput, projectId } as any;
    try { ws.send(JSON.stringify(payload)); } catch {}
    setChat((c)=>[...c, { role: 'user', text: chatInput }]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <div className="flex-1 min-h-0 flex">
        <div className="w-[280px] min-w-[220px] max-w-[360px] h-full bg-white border-r">
          <div className="px-3 py-2 border-b text-xs font-medium flex items-center justify-between">
            <span>Files</span>
            <button
              className="px-2 py-1 border rounded text-[11px]"
              onClick={() => {
                const name = prompt('New file path', '/new.js');
                if (!name) return;
                const ext = name.split('.').pop()?.toLowerCase();
                const lang = ext==='html'?'html':ext==='css'?'css':ext==='json'?'json':'javascript';
                setFiles((prev) => ({ ...prev, [name]: { content: '', language: lang } }));
                setActivePath(name);
              }}
            >New</button>
          </div>
          <div className="text-sm divide-y overflow-auto" style={{height:'calc(100% - 33px)'}}>
            {entries.map((p)=> (
              <div key={p} className={`flex items-center gap-2 px-3 py-2 ${activePath===p?'bg-blue-50 text-blue-700':''}`}>
                <button className="flex-1 text-left hover:underline" onClick={()=>setActivePath(p)}>{p}</button>
                <button
                  className="text-[11px] px-1.5 py-0.5 border rounded"
                  onClick={() => {
                    const to = prompt('Move/Rename to path', p);
                    if (!to || to === p) return;
                    setFiles((prev) => {
                      const next: FileMap = { ...prev };
                      next[to] = prev[p];
                      delete next[p];
                      return next;
                    });
                    if (activePath === p) setActivePath(to);
                  }}
                >Move</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-3 py-2 border-b text-xs flex items-center gap-2">
            <button className={`px-2 py-1 rounded ${view==='code'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setView('code')}>Code</button>
            <button className={`px-2 py-1 rounded ${view==='preview'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setView('preview')}>Preview</button>
            <span className="text-slate-500 ml-auto text-[11px]">Simplified UI</span>
          </div>
          {view==='code' ? (
            <CodeMirror
              value={files[activePath]?.content || ''}
              height="100%"
              theme="dark"
              extensions={langExtensions(activePath)}
              onChange={onChange}
            />
          ) : (
            <iframe title="preview" className="w-full h-full border-0 bg-white" srcDoc={srcdoc} sandbox="allow-scripts allow-same-origin" />
          )}
        </div>
      </div>
      <div className="h-48 border-t p-3 text-sm flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>AI Chat</span>
          <span className={connected? 'text-green-600':'text-slate-400'}>{connected? 'connected':'disconnected'}</span>
        </div>
        <div className="flex-1 overflow-auto border rounded p-2 bg-slate-50">
          {chat.length===0 ? <div className="text-xs text-slate-400">Say hello to the AI…</div> : (
            <div className="space-y-1">
              {chat.slice(-50).map((m,i)=> (
                <div key={i} className={m.role==='user'?'text-blue-700':'text-slate-800'}>
                  <span className="text-[11px] uppercase mr-2 opacity-60">{m.role}</span>{m.text}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input className="flex-1 border rounded px-2 py-1" value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Type here..." onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendChat(); } }} />
          <button className="px-3 py-1.5 border rounded" onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;

