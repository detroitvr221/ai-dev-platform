import React from 'react';
import Editor from '@monaco-editor/react';

function languageFromPath(filePath: string): string | undefined {
  if (!filePath) return 'markdown';
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.html')) return 'html';
  if (filePath.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

export function CodeEditor({ filePath, value, onChange, onSave }: { filePath: string; value: string; onChange: (v: string) => void; onSave: (v: string) => void }) {
  return (
    <div className="flex flex-col">
      <div className="px-2 py-1 border-b flex items-center gap-2 bg-white">
        <strong className="flex-1 truncate">{filePath || 'No file selected'}</strong>
        <button className="px-3 py-1 rounded bg-black text-white" onClick={() => onSave(value)}>Save</button>
      </div>
      <div style={{ height: '100%', minHeight: 300 }}>
        <Editor height="100%" language={languageFromPath(filePath)} value={value} onChange={(v) => onChange(v ?? '')} theme="vs-dark" options={{ fontSize: 14 }} />
      </div>
    </div>
  );
}

