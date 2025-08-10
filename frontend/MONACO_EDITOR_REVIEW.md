## Monaco No‑Code Editor Spec Review

This document reviews the current frontend against the requested Monaco-based no-code editor spec and outlines gaps and next steps.

### Summary
- The app has a Monaco-based editor (`CodeEditor`), a simple file explorer, and a preview pane wired to the backend project API.
- It does not yet implement a browser-persisted virtual file system, multi-file tabs, a dependencies panel, or the specified Zustand/idb-keyval/react-split-pane architecture.

### Tech Stack (Expected vs Current)
- React + TypeScript + Vite + Tailwind: Present (TS + Vite + Tailwind in place)
- @monaco-editor/react: Present
- monaco-editor: Missing as an explicit dependency (peer of wrapper)
- State: Zustand: Missing
- Persistence: idb-keyval: Missing
- Layout: react-split-pane: Missing
- Optional: esbuild-wasm: Missing

### Required Features vs Current Implementation
- 1) File Explorer (VFS)
  - Spec: Virtual file system with actions (New File/Folder, Rename, Delete, Generate from agent), keyboard navigation.
  - Current: `FileExplorer` renders a tree and selection. No CRUD actions, no keyboard navigation, backed by backend API instead of browser VFS.
  - Gap: Add VFS model + actions + a11y, decouple from backend by default; offer optional backend sync later.

- 2) Central Monaco Editor with Multi-file Tabs
  - Spec: Tab strip with close buttons, dirty dot, correct language, save updates state and persistence.
  - Current: `CodeEditor` configures Monaco with dark theme and options, but no tabs component; "dirty" handling is simplistic; save calls backend `writeFile`.
  - Gap: Implement `EditorTabs` and `MonacoEditorPane`, real dirty tracking per tab, and integrate with client-side store + persistence.

- 3) Right-side Live Preview Pane
  - Spec: Compose iframe `srcdoc` from project files; inject CSS/JS; debounce updates.
  - Current: `PreviewPane` loads `src/index.html` via backend and injects a `<base>` tag; no CSS/JS merging; coupled to server files; no debounce.
  - Gap: Add `buildPreviewHtml.ts` to assemble srcdoc from in-memory files, debounce on save, show empty state when non-web.

- 4) Bottom Dependencies Panel (package.json)
  - Spec: Read/write package.json in state; add/remove/bump deps; persist.
  - Current: No dependencies panel; no package.json editing UI; state is not modeled client-side.
  - Gap: Implement `DependenciesPanel` using `ProjectState.packageJson` with add/remove/bump and persistence.

- 5) Persistence in Browser
  - Spec: IndexedDB via idb-keyval for tree, files, tabs, active tab, package.json; Reset/Export ZIP (stub OK).
  - Current: State fetched from backend per file; no idb-keyval; no project hydration.
  - Gap: Add `state/useProjectStore.ts` (Zustand) and `state/persistence.ts` (idb-keyval) with hydration and save flows.

### Data Models (Types)
- Spec: `FileNode`, `OpenTab`, `ProjectState` with filesByPath and packageJson.
- Current: Not defined; ad-hoc state in components.
- Gap: Create shared types and migrate components to typed store selectors/actions.

### Layout
- Spec: 3-pane resizable (left/middle/right) with react-split-pane; bottom drawer for dependencies.
- Current: Grid layout in `NovaShell`, partial sidebar layout in `DevEnvironment`; no split-pane or bottom drawer.
- Gap: Implement `AppShell.tsx` using `react-split-pane` for responsive resizable panes and a toggleable bottom panel.

### Monaco Configuration
- Spec: `@monaco-editor/react` controlled editor, theme toggle, standard options.
- Current: `CodeEditor` sets many recommended options and uses `vs-dark`; no theme toggle; language inferred but helper not centralized.
- Gap: Add `Editor/monacoConfig.ts` and `utils/languageByExtension.ts`; add theme toggle.

### Accessibility & UX
- Spec: Keyboard shortcuts (S/W/P/B/J/K), tree navigation, focus rings, empty states, microinteractions.
- Current: Some empty states and styling; no global hotkeys, no tree keyboard navigation utilities.
- Gap: Implement `utils/hotkeys.ts` and keyboard handling across components; ensure aria-labels.

### Tests
- Spec: Example tests for `buildPreviewHtml.ts` and `fileUtils.ts`.
- Current: None.
- Gap: Add minimal Vitest/Jest tests for these utilities.

### Proposed Component/Folder Structure
- AppShell.tsx
- FileExplorer: `FileExplorer.tsx`, `FileItem.tsx`, `fileUtils.ts`
- Editor: `EditorTabs.tsx`, `MonacoEditorPane.tsx`, `monacoConfig.ts`
- Preview: `PreviewPane.tsx`, `buildPreviewHtml.ts`
- Dependencies: `DependenciesPanel.tsx`
- state: `useProjectStore.ts`, `persistence.ts`
- utils: `path.ts`, `languageByExtension.ts`, `hotkeys.ts`

### Dependency Actions
Run in `frontend`:
```
npm i zustand idb-keyval react-split-pane classnames
npm i @monaco-editor/react monaco-editor
npm i -D typescript vite @types/react @types/react-dom tailwindcss postcss autoprefixer
# Optional (phase 2)
npm i esbuild-wasm
```

### Implementation Notes
- Start by introducing the Zustand store and idb-keyval persistence, with seed files on first run (index.html, styles.css, main.js, package.json).
- Wire `FileExplorer` to the store (not the backend). Keep a future "Import from backend" or "Sync" action separate.
- Build `buildPreviewHtml.ts` and update `PreviewPane` to consume the in-memory project, with a 300ms debounce.
- Add `EditorTabs` with dirty tracking and keyboard shortcuts. Implement save (Cmd/Ctrl+S), close (Cmd/Ctrl+W), quick open (Cmd/Ctrl+P), and toggles (B/J/K).
- Keep an interface stub for phase 2 bundling with `esbuild-wasm` and import maps.

### Next Steps (Order)
1) Add dependencies, types, and store + persistence
2) Implement file explorer CRUD on the VFS
3) Implement tabs + Monaco integration
4) Implement preview assembly and debounce
5) Implement dependencies panel and package.json editing
6) Wire hotkeys and accessibility improvements
7) Add minimal tests and update README
