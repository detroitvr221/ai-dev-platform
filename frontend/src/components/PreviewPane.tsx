import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Eye, RefreshCw, ExternalLink, FileText, Globe } from 'lucide-react';

export function PreviewPane({ projectId, projectApi, entry = 'src/index.html' }: { 
  projectId: string | null; 
  projectApi: any; 
  entry?: string; 
}) {
  const { fileEvents } = useWebSocket();
  const [html, setHtml] = React.useState<string>('');
  const [lastUpdated, setLastUpdated] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await projectApi.readFile(projectId, entry);
      const base = `<base href="/preview/${projectId}/">`;
      const content = String(res.content || '');
      const htmlWithBase = content.includes('<base ') ? content : content.replace(/<head(\s*)>/i, `<head$1>\n${base}`);
      setHtml(htmlWithBase);
      setLastUpdated(Date.now());
    } catch (err) {
      setError('No preview available. Create src/index.html to see your project.');
      setHtml('<div style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center; color: #6b7280;"><h3 style="margin-bottom: 1rem; color: #374151;">No Preview Available</h3><p style="color: #9ca3af;">Create a <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.375rem;">src/index.html</code> file to see your project preview.</p></div>');
    } finally {
      setIsLoading(false);
    }
  }, [projectApi, projectId, entry]);

  React.useEffect(() => {
    load();
  }, [load, projectId]);

  React.useEffect(() => {
    if (!projectId) return;
    const relevant = fileEvents[fileEvents.length - 1];
    if (relevant && relevant.projectId === projectId && relevant.filePath.startsWith('src/')) {
      // Debounce slightly
      const t = setTimeout(load, 200);
      return () => clearTimeout(t);
    }
  }, [fileEvents, load, projectId]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
        <Globe size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
        <p className="text-sm text-center">
          Select a project to preview your application
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Preview Header */}
      <div className="px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Eye size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900">Live Preview</h3>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <FileText size={12} />
              <span className="truncate">{entry}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={load}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          
          {lastUpdated > 0 && (
            <div className="text-xs text-slate-500">
              Last updated: {formatTime(lastUpdated)}
            </div>
          )}
          
          {error && (
            <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200">
              Preview error
            </div>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Loading preview...</p>
            </div>
          </div>
        )}
        
        <iframe
          title="preview"
          className="w-full h-full border-0 bg-white"
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>

      {/* Preview Footer */}
      <div className="px-4 py-2 border-t border-slate-200/60 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
        <span>Live preview with auto-refresh</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}


