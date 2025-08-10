import React from 'react';
import { AgentUpdate } from '../../shared/types';
import { MessageSquare, Code, Database, FlaskConical, Cloud, Lightbulb, CheckCircle, XCircle, Loader2, Palette } from 'lucide-react';

interface AgentProgressProps {
  agentUpdates: AgentUpdate[];
}

const getAgentIcon = (agentName: string) => {
  switch (agentName) {
    case 'planning': return <Lightbulb className="w-6 h-6 text-yellow-400" />;
    case 'frontend': return <Code className="w-6 h-6 text-blue-400" />;
    case 'backend': return <MessageSquare className="w-6 h-6 text-green-400" />;
    case 'database': return <Database className="w-6 h-6 text-purple-400" />;
    case 'testing': return <FlaskConical className="w-6 h-6 text-red-400" />;
    case 'devops': return <Cloud className="w-6 h-6 text-teal-400" />;
    case 'assets': return <Palette className="w-6 h-6 text-pink-400" />;
    default: return <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />;
  }
};

const AgentProgress: React.FC<AgentProgressProps> = ({ agentUpdates }) => {
  // Group updates by agent to show latest status
  const latestAgentStatus = agentUpdates.reduce((acc, update) => {
    acc[update.agent] = update;
    return acc;
  }, {} as Record<string, AgentUpdate>);

  const agents = ['planning', 'frontend', 'backend', 'database', 'testing', 'devops', 'assets'];

  return (
    <div className="p-4 bg-gray-800 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-blue-400">Agent Progress</h2>
      <div className="space-y-6">
        {agents.map(agentName => {
          const status = latestAgentStatus[agentName]?.status || 'idle';
          const message = latestAgentStatus[agentName]?.message || 'Awaiting tasks...';
          const isError = status === 'error';
          const isCompleted = status === 'completed';
          const isStarted = status === 'started';

          return (
            <div key={agentName} className="bg-gray-700 p-4 rounded-lg shadow-lg">
              <div className="flex items-center mb-3">
                {getAgentIcon(agentName)}
                <span className="ml-3 text-lg font-bold text-gray-100 capitalize">{agentName} Agent</span>
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                  isError ? 'bg-red-500 text-white' :
                  isCompleted ? 'bg-green-500 text-white' :
                  isStarted ? 'bg-blue-500 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-3">{message}</p>
              <div className="w-full bg-gray-600 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${
                  isError ? 'bg-red-500' :
                  isCompleted ? 'bg-green-500' :
                  isStarted ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-500'
                }`} style={{ width: isCompleted ? '100%' : isStarted ? '50%' : '0%' }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentProgress;


