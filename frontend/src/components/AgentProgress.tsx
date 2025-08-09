import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { CheckCircle2, XCircle, Loader2, Bot, Code2, Database, TestTube2, Container, Layout } from 'lucide-react';

type AgentKey = 'planning' | 'frontend' | 'backend' | 'database' | 'testing' | 'devops';

const agentMeta: Record<AgentKey, { label: string; icon: React.ReactNode; color: string }> = {
  planning: { label: 'Planning', icon: <Bot className="w-4 h-4" />, color: 'from-violet-500 to-fuchsia-500' },
  frontend: { label: 'Frontend', icon: <Layout className="w-4 h-4" />, color: 'from-sky-500 to-cyan-500' },
  backend: { label: 'Backend', icon: <Code2 className="w-4 h-4" />, color: 'from-emerald-500 to-teal-500' },
  database: { label: 'Database', icon: <Database className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
  testing: { label: 'Testing', icon: <TestTube2 className="w-4 h-4" />, color: 'from-pink-500 to-rose-500' },
  devops: { label: 'DevOps', icon: <Container className="w-4 h-4" />, color: 'from-indigo-500 to-purple-500' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (status === 'error') return <XCircle className="w-4 h-4 text-rose-600" />;
  if (status === 'started' || status === 'progress') return <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />;
  return <span className="w-4 h-4 inline-block rounded-full bg-zinc-300" />;
}

export function AgentProgress() {
  const { agentUpdates } = useWebSocket();

  const latestByAgent = React.useMemo(() => {
    const map = new Map<AgentKey, { status: string; message?: string }>();
    for (const u of agentUpdates) {
      if (!u.agent) continue;
      const key = u.agent as AgentKey;
      if (!agentMeta[key]) continue;
      map.set(key, { status: u.status, message: u.message });
    }
    return map;
  }, [agentUpdates]);

  const planningTasks = React.useMemo(() => {
    // try to find last planning completion that contains tasks
    for (let i = agentUpdates.length - 1; i >= 0; i--) {
      const u = agentUpdates[i];
      if (u.agent === 'planning' && u.status === 'completed' && u.data && (u.data.data?.tasks || u.data.tasks)) {
        const tasks = (u.data.data?.tasks || u.data.tasks) as any[];
        if (Array.isArray(tasks)) return tasks;
      }
    }
    return [] as any[];
  }, [agentUpdates]);

  return (
    <div className="h-full overflow-auto p-3 bg-gradient-to-b from-zinc-50 to-white">
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(agentMeta) as AgentKey[]).map((k) => {
          const meta = agentMeta[k];
          const latest = latestByAgent.get(k);
          const status = latest?.status || 'idle';
          const message = latest?.message || 'Waiting';
          return (
            <div key={k} className="rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md bg-gradient-to-r ${meta.color} text-white`}>{meta.icon}</div>
                  <div className="font-medium text-sm">{meta.label}</div>
                </div>
                <StatusIcon status={status} />
              </div>
              <div className="mt-2 text-xs text-zinc-600 line-clamp-2">{message}</div>
              <div className="mt-3 h-1.5 rounded bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full transition-all bg-gradient-to-r ${meta.color}`}
                  style={{ width: status === 'completed' ? '100%' : status === 'started' || status === 'progress' ? '50%' : status === 'error' ? '100%' : '4%', opacity: status === 'error' ? 0.4 : 1 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold mb-2">Planned Tasks</div>
        {planningTasks.length === 0 ? (
          <div className="text-xs text-zinc-500">No tasks yet. Ask for a plan or start a build.</div>
        ) : (
          <div className="space-y-2">
            {planningTasks.map((t: any, idx: number) => (
              <div key={idx} className="rounded border bg-white p-2 text-xs">
                <div className="font-medium">{t.title || t.id}</div>
                <div className="text-zinc-600">{t.description}</div>
                <div className="mt-1 text-zinc-500">Assignee: {t.assignee || 'auto'}{Array.isArray(t.dependsOn) && t.dependsOn.length ? ` • Depends: ${t.dependsOn.join(', ')}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


