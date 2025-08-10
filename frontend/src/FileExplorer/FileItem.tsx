import React from 'react';
import type { FileNode } from '../state/useProjectStore';

export function FileItem({ node, depth, onOpen }: { node: FileNode; depth: number; onOpen: (path: string) => void }) {
  const [open, setOpen] = React.useState(true);
  const pad = { paddingLeft: depth * 12 } as React.CSSProperties;
  if (node.type === 'folder') {
    return (
      <div>
        <div className="px-2 py-1 text-sm cursor-pointer hover:bg-slate-100" style={pad} onClick={() => setOpen(!open)}>
          <span className="mr-2">{open ? '▾' : '▸'}</span>
          <span className="font-medium">{node.name}</span>
        </div>
        {open && node.children?.map((c) => (
          <FileItem key={c.id} node={c} depth={depth + 1} onOpen={onOpen} />
        ))}
      </div>
    );
  }
  return (
    <div className="px-2 py-1 text-sm cursor-pointer hover:bg-slate-50" style={pad} onClick={() => onOpen(node.path)}>
      {node.name}
    </div>
  );
}


