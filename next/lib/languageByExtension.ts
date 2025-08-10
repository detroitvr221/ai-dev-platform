export function langFromPath(path: string): 'html' | 'css' | 'javascript' | 'json' | 'plaintext' {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'js': return 'javascript';
    default: return 'plaintext';
  }
}


