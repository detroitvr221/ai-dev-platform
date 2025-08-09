import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function AgentStatus() {
  const { agentUpdates } = useWebSocket();
  return (
    <div style={{ padding: 8, borderTop: '1px solid #eee', overflow: 'auto' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Agent Activity</div>
      <div style={{ maxHeight: 220, overflow: 'auto', fontSize: 12 }}>
        {agentUpdates.slice(-20).map((u, idx) => (
          <div key={idx}>[{u.agent}] {u.status}: {u.message}</div>
        ))}
      </div>
    </div>
  );
}

