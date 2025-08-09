import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Folder, FolderOpenDot, FileText } from 'lucide-react';
function Node({ node, onSelect, depth = 0 }) {
    const [open, setOpen] = React.useState(true);
    const pad = { paddingLeft: depth * 12 };
    if (node.type === 'dir') {
        return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 cursor-pointer select-none", style: pad, onClick: () => setOpen(!open), children: [open ? _jsx(FolderOpenDot, { size: 16, className: "text-amber-600" }) : _jsx(Folder, { size: 16, className: "text-amber-700" }), _jsx("span", { className: "font-medium text-sm", children: node.name })] }), open && node.children?.map((child) => (_jsx(Node, { node: child, onSelect: onSelect, depth: depth + 1 }, child.path)))] }));
    }
    return (_jsxs("div", { className: "flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 cursor-pointer text-sm", style: { paddingLeft: depth * 12 + 16 }, onClick: () => onSelect(node.path), children: [_jsx(FileText, { size: 16, className: "text-zinc-500" }), _jsx("span", { children: node.name })] }));
}
export function FileExplorer({ tree, onSelect }) {
    return (_jsx("div", { className: "text-zinc-800 text-sm", children: tree?.map((n) => (_jsx(Node, { node: n, onSelect: onSelect }, n.path))) }));
}
