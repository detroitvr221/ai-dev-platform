import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function AgentStatus() {
  const { agentUpdates, fileEvents } = useWebSocket();
  return (
    <div style={{ padding: 8, borderTop: '1px solid #eee', overflow: 'auto' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Agent Activity</div>
      <div style={{ maxHeight: 220, overflow: 'auto', fontSize: 12 }}>
        {agentUpdates.slice(-50).map((u, idx) => (
          <div key={idx}>[{u.agent}] {u.status}: {u.message}</div>
        ))}
        <div style={{ marginTop: 8, fontWeight: 600 }}>File Events</div>
        {fileEvents.slice(-50).map((e, idx) => (
          <div key={idx}>{e.event} {e.projectId}/{e.filePath}</div>
        ))}
      </div>
    </div>
  );
}

