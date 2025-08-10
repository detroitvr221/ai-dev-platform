import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { useProjectStore } from '../state/useProjectStore';
import { getLanguageByExtension } from '../utils/languageByExtension';

function cmLangFor(path: string) {
  const lang = getLanguageByExtension(path);
  switch (lang) {
    case 'html':
      return [html({ autoCloseTags: true })];
    case 'css':
      return [css()];
    case 'json':
      return [json()];
    case 'javascript':
    default:
      return [javascript({ jsx: false, typescript: false })];
  }
}

export function CodeMirrorEditorPane() {
  const { openTabs, activeTabId, filesByPath, updateFileContent } = useProjectStore((s) => ({
    openTabs: s.openTabs,
    activeTabId: s.activeTabId,
    filesByPath: s.filesByPath,
    updateFileContent: s.updateFileContent,
  }));
  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const path = activeTab?.path;
  const value = (path && filesByPath[path]?.content) || '';
  const extensions = path ? cmLangFor(path) : [];

  if (!activeTab) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400">Open a file to begin editing</div>;
  }

  return (
    <CodeMirror
      value={value}
      height="100%"
      basicSetup={{ lineNumbers: true }}
      theme="dark"
      extensions={extensions}
      onChange={(v) => updateFileContent(path!, v)}
    />
  );
}


