import React from 'react';
import { Folder, FolderOpenDot, FileText } from 'lucide-react';

function Node({ node, onSelect, depth = 0 }: any) {
  const [open, setOpen] = React.useState(true);
  const pad = { paddingLeft: depth * 12 } as React.CSSProperties;
  if (node.type === 'dir') {
    return (
      <div>
        <div
          className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 cursor-pointer select-none"
          style={pad}
          onClick={() => setOpen(!open)}
        >
          {open ? <FolderOpenDot size={16} className="text-amber-600" /> : <Folder size={16} className="text-amber-700" />}
          <span className="font-medium text-sm">{node.name}</span>
        </div>
        {open && node.children?.map((child: any) => (
          <Node key={child.path} node={child} onSelect={onSelect} depth={depth + 1} />
        ))}
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 cursor-pointer text-sm"
      style={{ paddingLeft: depth * 12 + 16 }}
      onClick={() => onSelect(node.path)}
    >
      <FileText size={16} className="text-zinc-500" />
      <span>{node.name}</span>
    </div>
  );
}

export function FileExplorer({ tree, onSelect }: { tree: any[]; onSelect: (path: string) => void }) {
  return (
    <div className="text-zinc-800 text-sm">
      {tree?.map((n) => (
        <Node key={n.path} node={n} onSelect={onSelect} />
      ))}
    </div>
  );
}

