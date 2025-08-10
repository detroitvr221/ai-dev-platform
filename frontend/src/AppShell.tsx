import React from 'react';
import { useProjectStore } from './state/useProjectStore';
import { bindGlobalHotkeys } from './utils/hotkeys';
import { FileExplorer } from './FileExplorer/FileExplorer';
import { EditorTabs } from './Editor/EditorTabs';
import { CodeMirrorEditorPane } from './Editor/CodeMirrorEditorPane';
import { PreviewPane } from './Preview/PreviewPane';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatInterface } from './components/ChatInterface';

export function AppShell({ projectId }: { projectId: string | null }) {
  const hydrate = useProjectStore((s) => s.hydrate);
  const saveAll = useProjectStore((s) => s.saveAll);
  const closeTab = useProjectStore((s) => s.closeTab);
  const activeTabId = useProjectStore((s) => s.activeTabId);

  const [showExplorer, setShowExplorer] = React.useState(true);
  const [view, setView] = React.useState<'code' | 'preview'>('code');

  React.useEffect(() => { hydrate(); }, []);

  React.useEffect(() => bindGlobalHotkeys({
    save: () => saveAll(),
    closeTab: () => { if (activeTabId) closeTab(activeTabId); },
    toggleExplorer: () => setShowExplorer((v) => !v),
    togglePreview: () => setView((v) => (v === 'code' ? 'preview' : 'code')),
    toggleDeps: () => {},
  }), [activeTabId, saveAll, closeTab]);

  // Simple layout: center = code/preview toggle; right = file explorer; bottom = chat
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 flex flex-col border-r bg-white">
          <div className="px-3 py-2 border-b text-xs flex items-center gap-2">
            <button className={`px-2 py-1 rounded ${view==='code'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setView('code')}>Code</button>
            <button className={`px-2 py-1 rounded ${view==='preview'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setView('preview')}>Preview</button>
          </div>
          {view==='code' ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <ErrorBoundary label="EditorTabs"><EditorTabs /></ErrorBoundary>
              <div className="flex-1 min-h-0"><ErrorBoundary label="Editor"><CodeMirrorEditorPane /></ErrorBoundary></div>
            </div>
          ) : (
            <div className="flex-1 min-h-0"><ErrorBoundary label="Preview"><PreviewPane /></ErrorBoundary></div>
          )}
        </div>
        {showExplorer && (
          <div className="w-[300px] min-w-[240px] max-w-[400px] h-full bg-white border-l">
            <ErrorBoundary label="Explorer"><FileExplorer /></ErrorBoundary>
          </div>
        )}
      </div>
      <div className="h-64 border-t bg-white">
        <ErrorBoundary label="Chat"><ChatInterface selectedProjectId={projectId} /></ErrorBoundary>
      </div>
    </div>
  );
}


