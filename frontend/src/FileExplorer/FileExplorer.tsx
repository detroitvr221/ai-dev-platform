import React from 'react';
import { useProjectStore } from '../state/useProjectStore';
import { FileItem } from './FileItem';
import { createNewFilePath } from './fileUtils';

export function FileExplorer({ onToggleDeps }: { onToggleDeps?: () => void }) {
  const { tree, filesByPath, openFile, createFile, deletePath } = useProjectStore((s) => ({
    tree: s.tree,
    filesByPath: s.filesByPath,
    openFile: s.openFile,
    createFile: s.createFile,
    deletePath: s.deletePath,
  }));

  const onNewFile = () => {
    const existing = new Set(Object.keys(filesByPath));
    const path = createNewFilePath('/', 'untitled', 'txt', existing);
    createFile(path, '');
    openFile(path);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-2 py-1 border-b flex items-center gap-2 text-xs">
        <button className="px-2 py-1 border rounded" onClick={onNewFile}>New File</button>
        <button className="px-2 py-1 border rounded" onClick={onToggleDeps}>Deps</button>
      </div>
      <div className="flex-1 overflow-auto">
        {tree.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No files. Use "New File" to create one.</div>
        ) : (
          tree.map((n) => <FileItem key={n.id} node={n} depth={0} onOpen={openFile} />)
        )}
      </div>
    </div>
  );
}


