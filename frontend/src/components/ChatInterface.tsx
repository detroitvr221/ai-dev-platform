import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function ChatInterface({ selectedProjectId }: { selectedProjectId: string | null }) {
  const { send, agentUpdates } = useWebSocket();
  const [input, setInput] = useState('');

  const onSend = () => {
    if (!selectedProjectId) return;
    send({ type: 'user_message', text: input, projectId: selectedProjectId });
    setInput('');
  };

  return (
    <div className="grid grid-rows-[1fr_auto] h-full">
      <div className="p-2 overflow-auto space-y-1 text-sm">
        {agentUpdates.map((u, i) => (
          <div key={i}>
            <strong>[{u.agent}]</strong> {u.status} — {u.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t">
        <input className="flex-1 border rounded px-2 py-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder={!selectedProjectId ? 'Create/select a project first' : 'Describe what to build...'} />
        <button className="px-3 py-1 rounded bg-black text-white" onClick={onSend} disabled={!selectedProjectId || !input.trim()}>Send</button>
      </div>
    </div>
  );
}

