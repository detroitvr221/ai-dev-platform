import React from 'react';

type Stage = 'planning' | 'frontend' | 'backend';

function ringColor(status: 'idle' | 'active' | 'done' | 'error') {
  switch (status) {
    case 'active': return 'stroke-blue-500';
    case 'done': return 'stroke-green-500';
    case 'error': return 'stroke-red-500';
    default: return 'stroke-slate-300';
  }
}

export function AgentsPipeline({ agentUpdates }: { agentUpdates: any[] }) {
  const stages: { key: Stage; label: string; desc: string[] }[] = [
    { key: 'planning', label: 'Planner Agent', desc: ['PRD & Roadmap', 'API Specs', 'Tickets & Backlog'] },
    { key: 'frontend', label: 'UI Agent', desc: ['Design Tokens', 'Component Library', 'Wireframes'] },
    { key: 'backend', label: 'Coder Agent', desc: ['Scaffold', 'APIs', 'Tests & CI/CD'] },
  ];

  const statusBy: Record<Stage, 'idle' | 'active' | 'done' | 'error'> = {
    planning: 'idle', frontend: 'idle', backend: 'idle'
  };
  // derive stage statuses from recent updates
  for (const s of Object.keys(statusBy) as Stage[]) {
    const list = agentUpdates.filter((u) => (s === 'planning' && u.agent === 'planning') || (s === 'frontend' && u.agent === 'frontend') || (s === 'backend' && (u.agent === 'backend' || u.agent === 'database')));
    const last = list[list.length - 1];
    if (!last) continue;
    if (last.status === 'started' || last.status === 'stream') statusBy[s] = 'active';
    if (last.status === 'completed') statusBy[s] = 'done';
    if (last.status === 'error') statusBy[s] = 'error';
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white p-4 shadow-soft">
      <div className="grid grid-cols-3 gap-6 relative">
        {stages.map((st, idx) => (
          <div key={st.key} className="relative flex items-center gap-3">
            <div className="relative">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle className="stroke-slate-200 fill-none" strokeWidth="4" cx="18" cy="18" r="16"></circle>
                <circle className={`${ringColor(statusBy[st.key])} fill-none transition-all duration-500 ${statusBy[st.key]==='active'?'animate-[spin_3s_linear_infinite]':''}`} strokeWidth="4" strokeLinecap="round" cx="18" cy="18" r="16" pathLength={100} strokeDasharray={`${statusBy[st.key]==='done'?100:70} 100`} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-xs font-medium">{idx+1}</div>
            </div>
            <div>
              <div className="text-sm font-semibold">{st.label}</div>
              <ul className="text-[11px] text-slate-600 list-disc pl-4">
                {st.desc.map((d)=> <li key={d}>{d}</li>)}
              </ul>
            </div>
            {idx<stages.length-1 && (
              <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-[2px] bg-gradient-to-r from-slate-200 to-slate-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
