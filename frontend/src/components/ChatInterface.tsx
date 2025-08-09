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
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto' }}>
      <div style={{ padding: 8, overflow: 'auto' }}>
        {agentUpdates.map((u, i) => (
          <div key={i} style={{ fontSize: 12, marginBottom: 6 }}>
            <strong>[{u.agent}]</strong> {u.status} — {u.message}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid #eee' }}>
        <input style={{ flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder={!selectedProjectId ? 'Create/select a project first' : 'Describe what to build...'} />
        <button onClick={onSend} disabled={!selectedProjectId || !input.trim()}>Send</button>
      </div>
    </div>
  );
}

