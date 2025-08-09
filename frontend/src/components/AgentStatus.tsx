import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function AgentStatus() {
  const { agentUpdates, fileEvents } = useWebSocket();
  return (
    <div className="p-2 border-t overflow-auto bg-white">
      <div className="font-semibold mb-1">Agent Activity</div>
      <div className="max-h-56 overflow-auto text-xs space-y-1">
        {agentUpdates.slice(-50).map((u, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            <span className="font-medium">[{u.agent}]</span> {u.status}: {u.message}
          </div>
        ))}
        <div className="mt-2 font-semibold">File Events</div>
        {fileEvents.slice(-50).map((e, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{e.event} {e.projectId}/{e.filePath}</div>
        ))}
      </div>
    </div>
  );
}

