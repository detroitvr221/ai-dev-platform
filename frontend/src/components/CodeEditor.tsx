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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ flex: 1 }}>{filePath || 'No file selected'}</strong>
        <button onClick={() => onSave(value)}>Save</button>
      </div>
      <div style={{ height: '100%', minHeight: 300 }}>
        <Editor height="100%" language={languageFromPath(filePath)} value={value} onChange={(v) => onChange(v ?? '')} theme="vs-dark" options={{ fontSize: 14 }} />
      </div>
    </div>
  );
}

