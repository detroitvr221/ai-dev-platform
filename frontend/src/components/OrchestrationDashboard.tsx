import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ChatInterface } from './ChatInterface';
import { AgentsPipeline } from './AgentsPipeline';
import { PreviewDock } from './PreviewDock';

function useOrchestrationModel(agentUpdates: any[]) {
  const model = React.useMemo(() => {
    const stats: any = {
      total: agentUpdates.length,
      started: agentUpdates.filter((u) => u.status === 'started').length,
      completed: agentUpdates.filter((u) => u.status === 'completed').length,
      error: agentUpdates.filter((u) => u.status === 'error').length,
    };
    const byAgent: Record<string, any[]> = {};
    for (const u of agentUpdates) { if (!byAgent[u.agent]) byAgent[u.agent] = []; byAgent[u.agent].push(u); }
    // Capture planning output if JSON-like
    let prd = '';
    let roadmap = '';
    let tickets: string[] = [];
    let apis: string[] = [];
    const planning = byAgent['planning'] || [];
    let completed: any = null; for (let i = planning.length - 1; i >= 0; i--) { if (planning[i].status === 'completed') { completed = planning[i]; break; } }
    if (completed?.data) {
      try {
        const d = typeof completed.data === 'string' ? JSON.parse(completed.data) : completed.data;
        const json = d?.data || d;
        if (json?.prd) prd = String(json.prd);
        if (json?.roadmap) roadmap = Array.isArray(json.roadmap) ? json.roadmap.join('\n') : String(json.roadmap);
        if (Array.isArray(json?.tickets)) tickets = json.tickets.map((t: any) => t.title || String(t));
        if (Array.isArray(json?.apis)) apis = json.apis.map((a: any) => a.path || String(a));
      } catch {}
    }
    // Attempt to surface recent code or design URL from frontend/backend
    const codeUpdate = [...(byAgent['frontend']||[]), ...(byAgent['backend']||[])].reverse().find(u => u.data?.code || u.data?.files);
    const code = codeUpdate?.data?.code || '';
    const designUrl = (byAgent['frontend']||[]).reverse().find(u => u.data?.designUrl)?.data?.designUrl;
    return { stats, byAgent, prd, roadmap, tickets, apis, code, designUrl };
  }, [agentUpdates]);
  return model;
}

export function OrchestrationDashboard({ projectId }: { projectId: string | null }) {
  const { agentUpdates } = useWebSocket();
  const { stats, prd, roadmap, tickets, apis, code, designUrl } = useOrchestrationModel(agentUpdates);
  const progress = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const [mode, setMode] = React.useState<'guided'|'expert'>('guided');

  return (
    <div className="max-w-[1280px] mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">NovaCode</h1>
          <p className="text-sm text-slate-500">No‑code orchestration with Planner, UI, and Coder agents</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Mode</span>
          <div className="rounded-lg overflow-hidden border">
            <button className={`px-3 py-1 ${mode==='guided'?'bg-slate-900 text-white':'bg-white'}`} onClick={()=>setMode('guided')}>Guided</button>
            <button className={`px-3 py-1 ${mode==='expert'?'bg-slate-900 text-white':'bg-white'}`} onClick={()=>setMode('expert')}>Expert</button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-slate-600 mb-1">Orchestration Progress</div>
        <div className="h-2 rounded bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-6">
        <AgentsPipeline agentUpdates={agentUpdates} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Metric title="PRD" value={prd ? 1 : 0} subtitle="Document" animated />
            <Metric title="Roadmap" value={roadmap ? 1 : 0} subtitle="Defined" animated />
            <Metric title="Tickets" value={tickets.length} subtitle="Stories" animated />
          </div>
          <Tabs prd={prd} roadmap={roadmap} tickets={tickets} apis={apis} />
        </div>
        <div className="col-span-1 space-y-4">
          <PreviewDock prd={prd} apis={apis} code={code} designUrl={designUrl} />
          <div className="border rounded-lg bg-white shadow-soft">
            <div className="px-3 py-2 border-b text-sm font-medium">AI Agent Chat</div>
            <div className="h-[420px]">
              <ChatInterface selectedProjectId={projectId} />
            </div>
            <div className="px-3 py-2 border-t text-xs text-slate-500">Try: “Describe your app idea…” — e.g., “Build a booking platform with payments and calendar sync”</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, subtitle, animated }: { title: string; value: number | string; subtitle: string; animated?: boolean }) {
  return (
    <div className="border rounded-lg bg-white p-4 shadow-soft hover:shadow-medium transition-all">
      <div className="text-xs text-slate-500 mb-1">{title}</div>
      <div className={`text-2xl font-semibold ${animated?'transition-transform duration-300':''}`}>{value}</div>
      <div className="text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}

function Tabs({ prd, roadmap, tickets, apis }: { prd: string; roadmap: string; tickets: string[]; apis: string[] }) {
  const [tab, setTab] = React.useState<'prd' | 'roadmap' | 'tickets' | 'apis'>('prd');
  return (
    <div className="border rounded-lg bg-white shadow-soft">
      <div className="px-3 py-2 border-b text-sm flex gap-2">
        {(['prd', 'roadmap', 'tickets', 'apis'] as const).map((t) => (
          <button key={t} className={`px-3 py-1.5 rounded ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="p-4 text-sm font-mono whitespace-pre-wrap min-h-[260px] transition-opacity">
        {tab === 'prd' && (prd || <EmptyState title="No PRD yet" action="Generate PRD" hint="Start your project by defining the PRD. This will guide the UI and Coder agents." />)}
        {tab === 'roadmap' && (roadmap || <EmptyState title="No Roadmap yet" action="Outline Roadmap" hint="A roadmap defines phases and timelines for agents." />)}
        {tab === 'tickets' && ((tickets && tickets.length) ? tickets.map((t, i) => `- ${t}`).join('\n') : <EmptyState title="No Tickets yet" action="Generate Tickets" hint="Tickets break work into actionable stories." />)}
        {tab === 'apis' && ((apis && apis.length) ? apis.map((a, i) => `- ${a}`).join('\n') : <EmptyState title="No APIs yet" action="Draft API Spec" hint="Define endpoints for your backend early." />)}
      </div>
    </div>
  );
}

function EmptyState({title, action, hint}:{title:string; action:string; hint:string}){
  return (
    <div className="text-center text-slate-500">
      <div className="mb-2">{title}</div>
      <div className="text-xs mb-3">{hint}</div>
      <button className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">{action}</button>
    </div>
  );
}

