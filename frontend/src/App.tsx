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
      <header className="h-12 px-4 flex items-center justify-between bg-white border-b">
        <div className="font-bold tracking-wide">AI Dev Platform</div>
        <div className="text-sm opacity-60">Powered by multi-agent orchestration</div>
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

export default App;

