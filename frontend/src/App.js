import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "h-screen flex flex-col bg-zinc-50 text-zinc-900", children: [_jsxs("header", { className: "h-12 px-4 flex items-center justify-between bg-white border-b", children: [_jsx("div", { className: "font-bold tracking-wide", children: "AI Dev Platform" }), _jsx("div", { className: "text-sm opacity-60", children: "Powered by multi-agent orchestration" })] }), _jsx("div", { className: "flex-1", children: _jsx(DevEnvironment, { selectedProjectId: selectedProjectId, onSelectProject: setSelectedProjectId, projectApi: projectApi }) })] }));
}
export default App;
