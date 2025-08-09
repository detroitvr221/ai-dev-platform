import React from 'react';

function Node({ node, onSelect, depth = 0 }: any) {
  const [open, setOpen] = React.useState(true);
  if (node.type === 'dir') {
    return (
      <div>
        <div onClick={() => setOpen(!open)} style={{ paddingLeft: depth * 12, cursor: 'pointer', fontWeight: 600 }}>
          {open ? '📂' : '📁'} {node.name}
        </div>
        {open && node.children?.map((child: any) => (
          <Node key={child.path} node={child} onSelect={onSelect} depth={depth + 1} />
        ))}
      </div>
    );
  }
  return (
    <div onClick={() => onSelect(node.path)} style={{ paddingLeft: depth * 12 + 16, cursor: 'pointer' }}>
      📝 {node.name}
    </div>
  );
}

export function FileExplorer({ tree, onSelect }: { tree: any[]; onSelect: (path: string) => void }) {
  return (
    <div>
      {tree?.map((n) => (
        <Node key={n.path} node={n} onSelect={onSelect} />
      ))}
    </div>
  );
}

