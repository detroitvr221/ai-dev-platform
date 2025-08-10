"use client";
import React from 'react';

export function buildPreviewHtml(files: Record<string, { content: string; language: string }>): string {
  const indexHtml = files['/index.html']?.content || '';
  const css = Object.entries(files).filter(([p])=>p.endsWith('.css')).map(([,v])=>v.content).join('\n');
  const js = Object.entries(files).filter(([p])=>p.endsWith('.js')).map(([,v])=>v.content).join('\n');
  let base = indexHtml || `<!doctype html>\n<html>\n<head>\n<meta charset="UTF-8"/>\n<title>Preview</title>\n</head>\n<body>\n<div id="app">Hello</div>\n</body>\n</html>`;
  base = base.replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '').replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  base = base.replace(/<head(\s*)>/i, `<head$1>\n<style>\n${css}\n</style>`);
  base = base.replace(/<\/body>/i, `<script>\n${js}\n</script></body>`);
  return base;
}

export function PreviewPane({ html }: { html: string }) {
  return <iframe title="preview" className="w-full h-full border-0 bg-white" srcDoc={html} sandbox="allow-scripts allow-same-origin" />;
}


