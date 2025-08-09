import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ChatInterface } from './ChatInterface';
import { AgentStatus } from './AgentStatus';
import { PreviewPane } from './PreviewPane';
export function DevEnvironment({ selectedProjectId, onSelectProject, projectApi }) {
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [tree, setTree] = useState([]);
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
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '260px 1fr 360px', height: '100%' }, children: [_jsxs("div", { style: { borderRight: '1px solid #eee', overflow: 'auto' }, children: [_jsxs("div", { style: { padding: 8, display: 'flex', gap: 8 }, children: [_jsx("select", { value: selectedProjectId ?? '', onChange: (e) => onSelectProject(e.target.value), style: { flex: 1 }, children: projectApi.projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) }), _jsx("button", { onClick: () => projectApi.createProject().then((p) => onSelectProject(p.id)), children: "New" })] }), _jsx(FileExplorer, { tree: tree, onSelect: (p) => setSelectedFilePath(p) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateRows: '1fr 240px' }, children: [_jsx(CodeEditor, { filePath: selectedFilePath ?? '', value: fileContent, onChange: setFileContent, onSave: onSave }), _jsx(AgentStatus, {})] }), _jsx("div", { style: { borderLeft: '1px solid #eee' }, children: selectedProjectId ? (_jsx(PreviewPane, { projectId: selectedProjectId, projectApi: projectApi })) : (_jsx(ChatInterface, { selectedProjectId: selectedProjectId })) })] }));
}
