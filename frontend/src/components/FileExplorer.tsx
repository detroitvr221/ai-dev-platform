import React from 'react';
import { Folder, FolderOpen, FileText, FileCode, FileImage, File, Package } from 'lucide-react';

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return <FileCode size={16} className="text-blue-500" />;
    case 'html':
    case 'css':
    case 'scss':
      return <FileText size={16} className="text-purple-500" />;
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
      return <Package size={16} className="text-orange-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <FileImage size={16} className="text-green-500" />;
    case 'md':
    case 'txt':
      return <FileText size={16} className="text-slate-500" />;
    default:
      return <File size={16} className="text-slate-400" />;
  }
}

function Node({ node, onSelect, depth = 0, selectedPath }: any) {
  const [open, setOpen] = React.useState(true);
  const pad = { paddingLeft: depth * 16 } as React.CSSProperties;
  const isSelected = selectedPath === node.path;
  
  if (node.type === 'dir') {
    return (
      <div>
        <div
          className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-100 cursor-pointer select-none transition-colors ${
            open ? 'text-slate-900' : 'text-slate-700'
          }`}
          style={pad}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <FolderOpen size={16} className="text-amber-500" />
          ) : (
            <Folder size={16} className="text-amber-600" />
          )}
          <span className="font-medium text-sm">{node.name}</span>
          <span className="text-xs text-slate-400 ml-auto">
            {node.children?.length || 0}
          </span>
        </div>
        {open && node.children?.map((child: any) => (
          <Node 
            key={child.path} 
            node={child} 
            onSelect={onSelect} 
            depth={depth + 1} 
            selectedPath={selectedPath}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-all ${
        isSelected 
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
      }`}
      style={{ paddingLeft: depth * 16 + 20 }}
      onClick={() => onSelect(node.path)}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export function FileExplorer({ tree, onSelect, selectedPath }: { 
  tree: any[]; 
  onSelect: (path: string) => void;
  selectedPath?: string;
}) {
  if (!tree || tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Folder size={48} className="mb-2 opacity-50" />
        <p className="text-sm">No files yet</p>
        <p className="text-xs">Create a project to get started</p>
      </div>
    );
  }

  return (
    <div className="text-slate-800 text-sm py-2">
      {tree?.map((n) => (
        <Node 
          key={n.path} 
          node={n} 
          onSelect={onSelect} 
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

