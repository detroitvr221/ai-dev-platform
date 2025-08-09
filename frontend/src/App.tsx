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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DevEnvironment
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        projectApi={projectApi}
      />
    </div>
  );
}

export default App;

