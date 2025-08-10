import React from 'react';
// Monaco removed; this component is no longer in use. Keep as noop wrapper or migrate callers.
import { Save, FileText, Code, Palette } from 'lucide-react';

function languageFromPath(filePath: string): string | undefined {
  if (!filePath) return 'markdown';
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.css') || filePath.endsWith('.scss')) return 'css';
  if (filePath.endsWith('.html')) return 'html';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.py')) return 'python';
  if (filePath.endsWith('.java')) return 'java';
  if (filePath.endsWith('.sql')) return 'sql';
  return 'plaintext';
}

function getFileIcon(filePath: string) {
  if (!filePath) return <FileText size={16} />;
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <Code size={16} className="text-blue-500" />;
    case 'css':
    case 'scss':
      return <Palette size={16} className="text-purple-500" />;
    case 'html':
      return <FileText size={16} className="text-orange-500" />;
    case 'json':
      return <FileText size={16} className="text-yellow-500" />;
    case 'md':
      return <FileText size={16} className="text-green-500" />;
    default:
      return <FileText size={16} className="text-slate-500" />;
  }
}

export function CodeEditor({ filePath, value, onChange, onSave }: { 
  filePath: string; 
  value: string; 
  onChange: (v: string) => void; 
  onSave: (v: string) => void; 
}) {
  const language = languageFromPath(filePath);
  const hasChanges = value !== ''; // Simple change detection

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm">
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getFileIcon(filePath)}
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate">
              {filePath || 'No file selected'}
            </div>
            {filePath && (
              <div className="text-xs text-slate-500 capitalize">
                {language} • {value.length} characters
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {filePath && (
            <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 border">
              {language}
            </div>
          )}
          <button 
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              hasChanges && filePath
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            onClick={() => onSave(value)}
            disabled={!hasChanges || !filePath}
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        {filePath ? (
          <textarea className="w-full h-full p-3 font-mono text-sm outline-none" value={value} onChange={(e)=>onChange(e.target.value)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FileText size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No File Selected</h3>
            <p className="text-sm text-center">
              Select a file from the explorer to start editing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

