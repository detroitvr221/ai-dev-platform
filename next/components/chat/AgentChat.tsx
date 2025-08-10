"use client";
import React from 'react';
import { io, Socket } from 'socket.io-client';

type Msg = { role: 'user'|'agent'; text: string };

export function AgentChat(){
  const [socket, setSocket] = React.useState<Socket|null>(null);
  const [connected, setConnected] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [msgs, setMsgs] = React.useState<Msg[]>([]);

  React.useEffect(() => {
    const s = io('/', { path: '/socket.io' });
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('agent_event', (evt: any) => {
      if (evt?.payload) setMsgs((m)=>[...m, { role: 'agent', text: String(evt.payload) }]);
    });
    return () => { s.close(); };
  }, []);

  const send = () => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:user', { text: input });
    setMsgs((m)=>[...m, { role: 'user', text: input }]);
    setInput('');
  };

  return (
    <div className="h-48 border-t p-3 text-sm flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>AI Chat</span>
        <span className={connected? 'text-green-600':'text-slate-400'}>{connected? 'connected':'disconnected'}</span>
      </div>
      <div className="flex-1 overflow-auto border rounded p-2 bg-slate-50">
        {msgs.length===0 ? <div className="text-xs text-slate-400">Say hello…</div> : (
          <div className="space-y-1">
            {msgs.slice(-50).map((m,i)=> (
              <div key={i} className={m.role==='user'?'text-blue-700':'text-slate-800'}>
                <span className="text-[11px] uppercase mr-2 opacity-60">{m.role}</span>{m.text}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input className="flex-1 border rounded px-2 py-1" value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Type here..." onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } }} />
        <button className="px-3 py-1.5 border rounded" onClick={send}>Send</button>
      </div>
    </div>
  );
}


