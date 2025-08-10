import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageSquare, Code, Database, FlaskConical, Cloud, Lightbulb, CheckCircle, XCircle, Loader2, Palette, TrendingUp } from 'lucide-react';

const getAgentIcon = (agentName: string) => {
  switch (agentName) {
    case 'planning': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    case 'frontend': return <Code className="w-5 h-5 text-blue-500" />;
    case 'backend': return <MessageSquare className="w-5 h-5 text-green-500" />;
    case 'database': return <Database className="w-5 h-5 text-purple-500" />;
    case 'testing': return <FlaskConical className="w-5 h-5 text-red-500" />;
    case 'devops': return <Cloud className="w-5 h-5 text-teal-500" />;
    case 'assets': return <Palette className="w-5 h-5 text-pink-500" />;
    default: return <Loader2 className="w-5 h-5 text-slate-400" />;
  }
};

const getAgentDescription = (agentName: string) => {
  switch (agentName) {
    case 'planning': return 'Architecture & planning';
    case 'frontend': return 'UI/UX development';
    case 'backend': return 'API & server logic';
    case 'database': return 'Data modeling & queries';
    case 'testing': return 'Quality assurance';
    case 'devops': return 'Deployment & infrastructure';
    case 'assets': return 'Media & resources';
    default: return 'Specialized tasks';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'started': return 'bg-blue-500 text-white';
    case 'completed': return 'bg-green-500 text-white';
    case 'error': return 'bg-red-500 text-white';
    default: return 'bg-slate-400 text-white';
  }
};

const getProgressColor = (status: string) => {
  switch (status) {
    case 'started': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-slate-300';
  }
};

const getProgressWidth = (status: string) => {
  switch (status) {
    case 'started': return '50%';
    case 'completed': return '100%';
    case 'error': return '100%';
    default: return '0%';
  }
};

export function AgentProgress() {
  const { agentUpdates } = useWebSocket();
  const counts = React.useMemo(() => {
    let started = 0, completed = 0, errored = 0;
    for (const u of agentUpdates) {
      if (u.status === 'started') started++;
      if (u.status === 'completed') completed++;
      if (u.status === 'error') errored++;
    }
    return { started, completed, errored, total: agentUpdates.length };
  }, [agentUpdates]);

  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <div className="px-3 py-2 text-xs text-slate-500 border-b bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <span>Agent Metrics</span>
        <a href="/metrics" target="_blank" className="text-blue-600 hover:underline">Prometheus</a>
      </div>
      <div className="p-3 bg-white grid grid-cols-4 gap-3">
        <div className="rounded-lg p-3 bg-blue-50 border border-blue-100">
          <div className="text-xs text-blue-600">Started</div>
          <div className="text-xl font-semibold text-blue-800">{counts.started}</div>
        </div>
        <div className="rounded-lg p-3 bg-green-50 border border-green-100">
          <div className="text-xs text-green-600">Completed</div>
          <div className="text-xl font-semibold text-green-800">{counts.completed}</div>
        </div>
        <div className="rounded-lg p-3 bg-red-50 border border-red-100">
          <div className="text-xs text-red-600">Errors</div>
          <div className="text-xl font-semibold text-red-800">{counts.errored}</div>
        </div>
        <div className="rounded-lg p-3 bg-slate-50 border border-slate-100">
          <div className="text-xs text-slate-600">Total</div>
          <div className="text-xl font-semibold text-slate-800">{counts.total}</div>
        </div>
      </div>
    </div>
  );
}

export default AgentProgress;


