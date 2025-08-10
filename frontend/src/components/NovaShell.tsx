import React from 'react';
import { ChatInterface } from './ChatInterface';
import { PreviewPane } from './PreviewPane';

export function NovaShell({ projectId, projectApi }: { projectId: string | null; projectApi: any }) {
  return (
    <div className="grid grid-cols-2 gap-6 p-6 max-w-[1400px] mx-auto">
      <div className="border rounded-xl bg-white shadow-sm">
        <div className="px-4 py-3 border-b text-sm font-medium text-slate-700">Chat</div>
        <div className="h-[70vh]">
          <ChatInterface selectedProjectId={projectId} />
        </div>
      </div>
      <div className="border rounded-xl bg-white shadow-sm">
        <div className="px-4 py-3 border-b text-sm font-medium text-slate-700">Live Preview</div>
        <div className="h-[70vh]">
          {projectId && <PreviewPane projectId={projectId} projectApi={projectApi} />}
        </div>
      </div>
    </div>
  );
}
