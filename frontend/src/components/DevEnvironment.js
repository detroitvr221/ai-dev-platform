import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ChatInterface } from './ChatInterface';
import { AgentStatus } from './AgentStatus';
import { AgentProgress } from './AgentProgress';
import { PreviewPane } from './PreviewPane';
export function DevEnvironment({ selectedProjectId, onSelectProject, projectApi }) {
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [tree, setTree] = useState([]);
    const [mode, setMode] = useState('chat');
    useEffect(() => {
        if (!selectedProjectId)
            return;
        projectApi.fetchTree(selectedProjectId).then(setTree);
    }, [selectedProjectId]);
    useEffect(() => {
        if (!selectedProjectId || !selectedFilePath)
            return;
        projectApi.readFile(selectedProjectId, selectedFilePath).then((res) => setFileContent(res.content));
    }, [selectedProjectId, selectedFilePath]);
    const onSave = async (content) => {
        if (!selectedProjectId || !selectedFilePath)
            return;
        await projectApi.writeFile(selectedProjectId, selectedFilePath, content);
        setFileContent(content);
    };
    return (_jsxs("div", { className: "grid grid-cols-[280px_1fr_420px] h-full", children: [_jsxs("div", { className: "border-r overflow-auto bg-white", children: [_jsxs("div", { className: "p-2 flex gap-2 sticky top-0 bg-white border-b", children: [_jsx("select", { className: "flex-1 border rounded px-2 py-1", value: selectedProjectId ?? '', onChange: (e) => onSelectProject(e.target.value), children: projectApi.projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) }), _jsx("button", { className: "px-3 py-1 rounded bg-black text-white", onClick: () => projectApi.createProject().then((p) => onSelectProject(p.id)), children: "New" })] }), _jsx(FileExplorer, { tree: tree, onSelect: (p) => setSelectedFilePath(p) })] }), _jsxs("div", { className: "grid grid-rows-[1fr_240px]", children: [_jsx(CodeEditor, { filePath: selectedFilePath ?? '', value: fileContent, onChange: setFileContent, onSave: onSave }), _jsx(AgentStatus, {})] }), _jsxs("div", { className: "border-l grid grid-rows-[40px_1fr] bg-white", children: [_jsxs("div", { className: "border-b flex gap-2 p-2", children: [_jsx(Tab, { label: "Chat", activeKey: mode, tabKey: "chat", onClick: () => setMode('chat') }), _jsx(Tab, { label: "Preview", activeKey: mode, tabKey: "preview", onClick: () => setMode('preview') }), _jsx(Tab, { label: "Progress", activeKey: mode, tabKey: "progress", onClick: () => setMode('progress') })] }), _jsxs("div", { className: "h-full", children: [mode === 'chat' && _jsx(ChatInterface, { selectedProjectId: selectedProjectId }), mode === 'preview' && selectedProjectId && (_jsx(PreviewPane, { projectId: selectedProjectId, projectApi: projectApi })), mode === 'progress' && _jsx(AgentProgress, {})] })] })] }));
}
function Tab({ label, activeKey, tabKey, onClick }) {
    const active = activeKey === tabKey;
    return (_jsx("button", { onClick: onClick, style: {
            padding: '4px 8px',
            borderRadius: 4,
            background: active ? '#111' : 'transparent',
            color: active ? '#fff' : '#111',
            border: '1px solid #eee'
        }, children: label }));
}
