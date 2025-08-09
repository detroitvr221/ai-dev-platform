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
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 360px', height: '100%' }}>
      <div style={{ borderRight: '1px solid #eee', overflow: 'auto' }}>
        <div style={{ padding: 8, display: 'flex', gap: 8 }}>
          <select value={selectedProjectId ?? ''} onChange={(e) => onSelectProject(e.target.value)} style={{ flex: 1 }}>
            {projectApi.projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => projectApi.createProject().then((p: any) => onSelectProject(p.id))}>New</button>
        </div>
        <FileExplorer tree={tree} onSelect={(p) => setSelectedFilePath(p)} />
      </div>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 240px' }}>
        <CodeEditor filePath={selectedFilePath ?? ''} value={fileContent} onChange={setFileContent} onSave={onSave} />
        <AgentStatus />
      </div>
      <div style={{ borderLeft: '1px solid #eee', display: 'grid', gridTemplateRows: '32px 1fr' }}>
        <div style={{ borderBottom: '1px solid #eee', display: 'flex', gap: 8, padding: '4px 6px' }}>
          <Tab label="Chat" activeKey={mode} tabKey="chat" onClick={() => setMode('chat')} />
          <Tab label="Preview" activeKey={mode} tabKey="preview" onClick={() => setMode('preview')} />
        </div>
        <div>
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

