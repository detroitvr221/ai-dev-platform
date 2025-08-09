import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function PreviewPane({ projectId, projectApi, entry = 'src/index.html' }: { projectId: string | null; projectApi: any; entry?: string }) {
  const { fileEvents } = useWebSocket();
  const [html, setHtml] = React.useState<string>('');
  const [lastUpdated, setLastUpdated] = React.useState<number>(0);

  const load = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await projectApi.readFile(projectId, entry);
      setHtml(res.content || '');
      setLastUpdated(Date.now());
    } catch {
      setHtml('<h3 style="font-family: sans-serif; color: #999">No preview available. Create src/index.html</h3>');
    }
  }, [projectApi, projectId, entry]);

  React.useEffect(() => {
    load();
  }, [load, projectId]);

  React.useEffect(() => {
    if (!projectId) return;
    const relevant = fileEvents[fileEvents.length - 1];
    if (relevant && relevant.projectId === projectId && relevant.filePath.startsWith('src/')) {
      // Debounce slightly
      const t = setTimeout(load, 200);
      return () => clearTimeout(t);
    }
  }, [fileEvents, load, projectId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ flex: 1 }}>Preview: {entry}</strong>
        <button onClick={load}>Refresh</button>
      </div>
      <iframe
        title="preview"
        style={{ width: '100%', height: '100%', border: 0, background: 'white' }}
        srcDoc={html}
      />
    </div>
  );
}


