import type { ProjectState } from '../state/useProjectStore';

export function buildPreviewHtml(state: ProjectState): string {
  const files = state.filesByPath;
  const indexHtml = files['/index.html']?.content || '';
  const css = Object.entries(files)
    .filter(([p]) => p.endsWith('.css'))
    .map(([, v]) => v.content)
    .join('\n');
  const js = Object.entries(files)
    .filter(([p]) => p.endsWith('.js'))
    .map(([, v]) => v.content)
    .join('\n');

  // Start from index.html if present; otherwise, a minimal shell
  let base = indexHtml || `<!doctype html>\n<html>\n<head>\n<meta charset="UTF-8"/>\n<title>Preview</title>\n</head>\n<body>\n<div id="app">Create index.html to customize this preview.</div>\n</body>\n</html>`;

  // Strip external script tags to avoid loading /main.js or other network scripts in srcdoc
  base = base.replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');
  // Optionally strip external stylesheet links; we inline CSS below
  base = base.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

  const injectStyles = (html: string) => html.replace(/<head(\s*)>/i, `<head$1>\n<style>\n${css}\n</style>`);
  const injectScripts = (html: string) => html.replace(/<\/body>/i, `<script>\n${js}\n</script></body>`);

  return injectScripts(injectStyles(base));
}


