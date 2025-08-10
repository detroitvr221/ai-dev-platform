import React from 'react';
import { buildPreviewHtml } from './buildPreviewHtml';
import { useProjectStore } from '../state/useProjectStore';

export function PreviewPane() {
  const state = useProjectStore((s) => s);
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    const id = setTimeout(() => {
      setHtml(buildPreviewHtml(state));
    }, 300);
    return () => clearTimeout(id);
  }, [state.filesByPath, state.lastSavedAt]);

  return (
    <iframe title="preview" className="w-full h-full border-0 bg-white" srcDoc={html} sandbox="allow-scripts allow-same-origin" />
  );
}


