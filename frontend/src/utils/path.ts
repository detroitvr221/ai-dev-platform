export function joinPath(...parts: string[]): string {
  const joined = parts.join('/').replace(/\\/g, '/');
  return normalizeSlashes(joined);
}

export function dirname(path: string): string {
  if (path === '/' || !path) return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

export function basename(path: string): string {
  if (!path) return '';
  const parts = path.split('/').filter(Boolean);
  return parts.pop() || '';
}

function normalizeSlashes(p: string): string {
  // Collapse multiple slashes, ensure leading slash
  let out = p.replace(/\/+/g, '/').replace(/\/+/g, '/');
  if (!out.startsWith('/')) out = '/' + out;
  // Remove trailing slash except for root
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
  return out;
}


