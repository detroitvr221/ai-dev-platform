import React from 'react';
import { AgentUpdate } from '../../shared/types';
import { MessageSquare, Code, Database, FlaskConical, Cloud, Lightbulb, CheckCircle, XCircle, Loader2, Palette } from 'lucide-react';

interface AgentStatusProps {
  agentUpdates: AgentUpdate[];
}

const getAgentIcon = (agentName: string) => {
  switch (agentName) {
    case 'planning': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
    case 'frontend': return <Code className="w-5 h-5 text-blue-400" />;
    case 'backend': return <MessageSquare className="w-5 h-5 text-green-400" />;
    case 'database': return <Database className="w-5 h-5 text-purple-400" />;
    case 'testing': return <FlaskConical className="w-5 h-5 text-red-400" />;
    case 'devops': return <Cloud className="w-5 h-5 text-teal-400" />;
    case 'assets': return <Palette className="w-5 h-5 text-pink-400" />;
    default: return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
  }
};

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

