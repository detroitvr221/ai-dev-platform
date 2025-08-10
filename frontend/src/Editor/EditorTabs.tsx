import React from 'react';
import { useProjectStore } from '../state/useProjectStore';

export function EditorTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useProjectStore((s) => ({
    openTabs: s.openTabs,
    activeTabId: s.activeTabId,
    setActiveTab: s.setActiveTab,
    closeTab: s.closeTab,
  }));

  return (
    <div className="w-full border-b bg-white/70 backdrop-blur-sm flex overflow-x-auto">
      {openTabs.map((t) => (
        <button
          key={t.id}
          className={`px-3 py-2 text-sm flex items-center gap-2 border-r hover:bg-slate-50 ${t.id === activeTabId ? 'bg-white font-medium' : ''}`}
          onClick={() => setActiveTab(t.id)}
          aria-label={`Open tab ${t.name}`}
        >
          <span className="truncate max-w-[200px]">{t.name}</span>
          {t.dirty && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          <span
            className="ml-1 text-slate-400 hover:text-slate-600"
            role="button"
            aria-label={`Close tab ${t.name}`}
            onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}


