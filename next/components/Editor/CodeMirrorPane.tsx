"use client";
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';

function extsFor(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return [html({ autoCloseTags: true })];
    case 'css': return [css()];
    case 'json': return [json()];
    default: return [javascript({ jsx: false, typescript: false })];
  }
}

export function CodeMirrorPane({ path, value, onChange }: { path: string; value: string; onChange: (v: string)=>void }) {
  return (
    <CodeMirror value={value} height="100%" theme="dark" extensions={extsFor(path)} onChange={onChange} />
  );
}


