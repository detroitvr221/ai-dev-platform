import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { DevEnvironment } from './components/DevEnvironment';
import { useProject } from './hooks/useProject';
export function App() {
    const projectApi = useProject();
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    useEffect(() => {
        projectApi.refreshProjects();
    }, []);
    useEffect(() => {
        if (!selectedProjectId && projectApi.projects.length) {
            setSelectedProjectId(projectApi.projects[0].id);
        }
    }, [projectApi.projects, selectedProjectId]);
    return (_jsx("div", { style: { height: '100vh', display: 'flex', flexDirection: 'column' }, children: _jsx(DevEnvironment, { selectedProjectId: selectedProjectId, onSelectProject: setSelectedProjectId, projectApi: projectApi }) }));
}
export default App;
