import React from 'react';
export function useProject() {
    const [projects, setProjects] = React.useState([]);
    const refreshProjects = async () => {
        const res = await fetch('/api/projects');
        setProjects(await res.json());
    };
    const createProject = async (name) => {
        const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        const proj = await res.json();
        await refreshProjects();
        return proj;
    };
    const fetchTree = async (projectId) => {
        const res = await fetch(`/api/projects/${projectId}/tree`);
        return res.json();
    };
    const readFile = async (projectId, filePath) => {
        const url = new URL('/api/projects/' + projectId + '/file', window.location.origin);
        url.searchParams.set('filePath', filePath);
        const res = await fetch(url.toString().replace(window.location.origin, ''));
        return res.json();
    };
    const writeFile = async (projectId, filePath, content) => {
        await fetch(`/api/projects/${projectId}/file`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath, content }) });
    };
    return { projects, refreshProjects, createProject, fetchTree, readFile, writeFile };
}
