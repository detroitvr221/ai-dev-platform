import React, { useEffect, useMemo, useState } from 'react';
import { DevEnvironment } from './components/DevEnvironment';
import { useProject } from './hooks/useProject';

export function App() {
  const projectApi = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    projectApi.refreshProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId && projectApi.projects.length) {
      setSelectedProjectId(projectApi.projects[0].id);
    }
  }, [projectApi.projects, selectedProjectId]);

  return (
    <div className="h-screen flex flex-col bg-zinc-50 text-zinc-900">
      <header className="h-14 px-6 flex items-center justify-between bg-white border-b sticky top-0 z-10">
        <div className="font-bold tracking-wide text-lg">AI Agent System</div>
        <div className="flex items-center gap-3 text-sm">
          <OpenAIStatus />
        </div>
      </header>
      <div className="flex-1">
        <DevEnvironment
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          projectApi={projectApi}
        />
      </div>
    </div>
  );
}

function OpenAIStatus() {
  const [status, setStatus] = React.useState<'checking' | 'ok' | 'error'>('checking');
  const [detail, setDetail] = React.useState('');
  React.useEffect(() => {
    fetch('/api/validate/openai')
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'error');
        return r.json();
      })
      .then((d) => {
        setStatus('ok');
        setDetail(Array.isArray(d.models) && d.models.length ? `models: ${d.models.join(', ')}` : 'connected');
      })
      .catch((e) => {
        setStatus('error');
        setDetail(String(e.message || 'not set'));
      });
  }, []);
  return (
    <div className="text-xs px-2 py-1 rounded border bg-white">
      <span className="font-medium">OpenAI</span>: {status === 'checking' ? 'checking…' : status === 'ok' ? 'ok' : 'error'}
      {detail ? <span className="opacity-60"> • {detail}</span> : null}
    </div>
  );
}

export default App;

