type HotkeyHandler = (e: KeyboardEvent) => void;

export type HotkeyMap = {
  save?: HotkeyHandler;       // Cmd/Ctrl+S
  closeTab?: HotkeyHandler;   // Cmd/Ctrl+W
  quickOpen?: HotkeyHandler;  // Cmd/Ctrl+P
  toggleExplorer?: HotkeyHandler; // Cmd/Ctrl+B
  toggleDeps?: HotkeyHandler;     // Cmd/Ctrl+J
  togglePreview?: HotkeyHandler;  // Cmd/Ctrl+K
};

export function bindGlobalHotkeys(map: HotkeyMap): () => void {
  function handler(e: KeyboardEvent) {
    const cmd = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    if (!cmd) return;
    if (key === 's' && map.save) { e.preventDefault(); map.save(e); }
    if (key === 'w' && map.closeTab) { e.preventDefault(); map.closeTab(e); }
    if (key === 'p' && map.quickOpen) { e.preventDefault(); map.quickOpen(e); }
    if (key === 'b' && map.toggleExplorer) { e.preventDefault(); map.toggleExplorer(e); }
    if (key === 'j' && map.toggleDeps) { e.preventDefault(); map.toggleDeps(e); }
    if (key === 'k' && map.togglePreview) { e.preventDefault(); map.togglePreview(e); }
  }
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}


