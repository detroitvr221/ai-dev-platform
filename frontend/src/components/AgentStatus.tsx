import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageSquare, Code, Database, FlaskConical, Cloud, Lightbulb, CheckCircle, XCircle, Loader2, Palette, FileText } from 'lucide-react';

const getAgentIcon = (agentName: string) => {
  switch (agentName) {
    case 'planning': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
    case 'frontend': return <Code className="w-4 h-4 text-blue-500" />;
    case 'backend': return <MessageSquare className="w-4 h-4 text-green-500" />;
    case 'database': return <Database className="w-4 h-4 text-purple-500" />;
    case 'testing': return <FlaskConical className="w-4 h-4 text-red-500" />;
    case 'devops': return <Cloud className="w-4 h-4 text-teal-500" />;
    case 'assets': return <Palette className="w-4 h-4 text-pink-500" />;
    default: return <Loader2 className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'started': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'completed': return 'text-green-600 bg-green-50 border-green-200';
    case 'error': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export function AgentStatus() {
  const { agentUpdates } = useWebSocket();
  const [streamText, setStreamText] = React.useState('');

  React.useEffect(() => {
    if (!agentUpdates.length) return;
    const last = agentUpdates[agentUpdates.length - 1];
    if (last.status === 'stream' && typeof last.message === 'string') {
      setStreamText((prev) => (prev + last.message).slice(-8000));
    }
  }, [agentUpdates]);

  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <div className="px-3 py-2 text-xs text-slate-500 border-b bg-gradient-to-r from-slate-50 to-white">
        Live Stream
      </div>
      <div className="p-3 overflow-auto bg-white">
        {streamText ? (
          <pre className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800">
            {streamText}
          </pre>
        ) : (
          <div className="text-xs text-slate-400">No streaming output yet.</div>
        )}
      </div>
    </div>
  );
}

