import React from 'react';

export function useProject() {
  const [projects, setProjects] = React.useState<any[]>([]);

  const refreshProjects = async () => {
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      setProjects(await res.json());
    } catch {
      setProjects([]);
    }
  };

  const createProject = async (name?: string) => {
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const proj = await res.json();
    await refreshProjects();
    return proj;
  };

  const fetchTree = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/tree`);
    return res.json();
  };

  const readFile = async (projectId: string, filePath: string) => {
    const url = new URL('/api/projects/' + projectId + '/file', window.location.origin);
    url.searchParams.set('filePath', filePath);
    const res = await fetch(url.toString().replace(window.location.origin, ''));
    return res.json();
  };

  const writeFile = async (projectId: string, filePath: string, content: string) => {
    await fetch(`/api/projects/${projectId}/file`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath, content }) });
  };

  const uploadFiles = async (projectId: string, files: File[], baseDir?: string) => {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    if (baseDir) form.append('baseDir', baseDir);
    const res = await fetch(`/api/projects/${projectId}/upload`, { method: 'POST', body: form });
    return res.json();
  };

  return { projects, refreshProjects, createProject, fetchTree, readFile, writeFile, uploadFiles };
}

