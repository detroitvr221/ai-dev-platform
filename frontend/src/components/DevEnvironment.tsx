import React, { useEffect, useMemo, useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ChatInterface } from './ChatInterface';
import { AgentStatus } from './AgentStatus';
import { PreviewPane } from './PreviewPane';

export function DevEnvironment({ selectedProjectId, onSelectProject, projectApi }: {
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  projectApi: any;
}) {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [tree, setTree] = useState<any[]>([]);
  const [mode, setMode] = useState<'chat' | 'preview'>('chat');

  useEffect(() => {
    if (!selectedProjectId) return;
    projectApi.fetchTree(selectedProjectId).then(setTree);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || !selectedFilePath) return;
    projectApi.readFile(selectedProjectId, selectedFilePath).then((res: any) => setFileContent(res.content));
  }, [selectedProjectId, selectedFilePath]);

  const onSave = async (content: string) => {
    if (!selectedProjectId || !selectedFilePath) return;
    await projectApi.writeFile(selectedProjectId, selectedFilePath, content);
    setFileContent(content);
  };

  return (
    <div className="grid grid-cols-[280px_1fr_420px] h-full">
      <div className="border-r overflow-auto bg-white">
        <div className="p-2 flex gap-2 sticky top-0 bg-white border-b">
          <select className="flex-1 border rounded px-2 py-1" value={selectedProjectId ?? ''} onChange={(e) => onSelectProject(e.target.value)}>
            {projectApi.projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="px-3 py-1 rounded bg-black text-white" onClick={() => projectApi.createProject().then((p: any) => onSelectProject(p.id))}>New</button>
        </div>
        <FileExplorer tree={tree} onSelect={(p) => setSelectedFilePath(p)} />
      </div>
      <div className="grid grid-rows-[1fr_240px]">
        <CodeEditor filePath={selectedFilePath ?? ''} value={fileContent} onChange={setFileContent} onSave={onSave} />
        <AgentStatus />
      </div>
      <div className="border-l grid grid-rows-[40px_1fr] bg-white">
        <div className="border-b flex gap-2 p-2">
          <Tab label="Chat" activeKey={mode} tabKey="chat" onClick={() => setMode('chat')} />
          <Tab label="Preview" activeKey={mode} tabKey="preview" onClick={() => setMode('preview')} />
        </div>
        <div className="h-full">
          {mode === 'chat' && <ChatInterface selectedProjectId={selectedProjectId} />}
          {mode === 'preview' && selectedProjectId && (
            <PreviewPane projectId={selectedProjectId} projectApi={projectApi} />
          )}
        </div>
      </div>
    </div>
  );
}

function Tab({ label, activeKey, tabKey, onClick }: { label: string; activeKey: string; tabKey: string; onClick: () => void }) {
  const active = activeKey === tabKey;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        background: active ? '#111' : 'transparent',
        color: active ? '#fff' : '#111',
        border: '1px solid #eee'
      }}
    >
      {label}
    </button>
  );
}

