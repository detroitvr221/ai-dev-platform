import React, { useEffect, useMemo, useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ChatInterface } from './ChatInterface';
import { AgentStatus } from './AgentStatus';
import { AgentProgress } from './AgentProgress';
import { PreviewPane } from './PreviewPane';

export function DevEnvironment({ selectedProjectId, onSelectProject, projectApi }: {
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  projectApi: any;
}) {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [tree, setTree] = useState<any[]>([]);
  const [mode, setMode] = useState<'chat' | 'preview' | 'progress'>('chat');
  const [showGitModal, setShowGitModal] = useState(false);
  const [gitRemote, setGitRemote] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitMessage, setGitMessage] = useState('Update from AI Dev Platform');
  const [gitDiff, setGitDiff] = useState<string>('');

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
    <div className="grid grid-cols-[300px_1fr_450px] h-full gap-0">
      {/* Left Sidebar - File Explorer */}
      <div className="bg-white/80 backdrop-blur-sm border-r border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex gap-2 mb-3">
            <select 
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={selectedProjectId ?? ''} 
              onChange={(e) => onSelectProject(e.target.value)}
            >
              {projectApi.projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
              onClick={() => projectApi.createProject().then((p: any) => onSelectProject(p.id))}
            >
              New
            </button>
            <label className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium cursor-pointer hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
              Upload
              <input
                type="file"
                multiple
                className="hidden"
                onChange={async (e) => {
                  if (!selectedProjectId || !e.target.files?.length) return;
                  await projectApi.uploadFiles(selectedProjectId, Array.from(e.target.files));
                  const updated = await projectApi.fetchTree(selectedProjectId);
                  setTree(updated);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <button
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              onClick={() => setShowGitModal(true)}
              disabled={!selectedProjectId}
            >
              Push to Git
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {projectApi.projects.length} project{projectApi.projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <FileExplorer tree={tree} onSelect={(p) => setSelectedFilePath(p)} selectedPath={selectedFilePath ?? undefined} />
        </div>
      </div>

      {/* Center - Code Editor & Agent Status */}
      <div className="grid grid-rows-[1fr_280px] bg-white/60 backdrop-blur-sm">
        <CodeEditor filePath={selectedFilePath ?? ''} value={fileContent} onChange={setFileContent} onSave={onSave} />
        <div className="border-t border-slate-200/60 bg-white/80">
          <AgentStatus />
        </div>
      </div>

      {/* Right Sidebar - Chat, Preview, Progress */}
      <div className="bg-white/80 backdrop-blur-sm border-l border-slate-200/60 flex flex-col">
        <div className="border-b border-slate-200/60 bg-gradient-to-r from-white to-slate-50">
          <div className="flex gap-1 p-3">
            <Tab label="Chat" activeKey={mode} tabKey="chat" onClick={() => setMode('chat')} />
            <Tab label="Preview" activeKey={mode} tabKey="preview" onClick={() => setMode('preview')} />
            <Tab label="Progress" activeKey={mode} tabKey="progress" onClick={() => setMode('progress')} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {mode === 'chat' && <ChatInterface selectedProjectId={selectedProjectId} />}
          {mode === 'preview' && selectedProjectId && (
            <PreviewPane projectId={selectedProjectId} projectApi={projectApi} />
          )}
          {mode === 'progress' && <AgentProgress />}
        </div>
      </div>
      {showGitModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-strong w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Push to Git</h3>
            <p className="text-sm text-slate-600 mb-4">Enter your remote URL. We will commit and push the current project to the <span className="font-mono">main</span> branch.</p>
            <input
              value={gitRemote}
              onChange={(e) => setGitRemote(e.target.value)}
              placeholder="https://github.com/you/repo.git"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={gitBranch} onChange={(e)=>setGitBranch(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Branch (main)" />
              <input value={gitMessage} onChange={(e)=>setGitMessage(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Commit message" />
            </div>
            {gitDiff && (
              <div className="mb-3 p-2 bg-slate-50 border rounded text-xs text-slate-600 max-h-40 overflow-auto">
                <pre>{gitDiff}</pre>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setShowGitModal(false)}>Cancel</button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={async () => {
                  if (!selectedProjectId || !gitRemote) return;
                  // Simple dry-run: fetch project tree and show file list
                  const tree = await projectApi.fetchTree(selectedProjectId);
                  setGitDiff(JSON.stringify(tree, null, 2));
                  await fetch(`/api/projects/${selectedProjectId}/git/push`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remote: gitRemote, branch: gitBranch, message: gitMessage }) });
                  setShowGitModal(false);
                }}
              >
                Push
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({ label, activeKey, tabKey, onClick }: { label: string; activeKey: string; tabKey: string; onClick: () => void }) {
  const active = activeKey === tabKey;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-sm' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

