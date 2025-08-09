import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
function Node({ node, onSelect, depth = 0 }) {
    const [open, setOpen] = React.useState(true);
    if (node.type === 'dir') {
        return (_jsxs("div", { children: [_jsxs("div", { onClick: () => setOpen(!open), style: { paddingLeft: depth * 12, cursor: 'pointer', fontWeight: 600 }, children: [open ? '📂' : '📁', " ", node.name] }), open && node.children?.map((child) => (_jsx(Node, { node: child, onSelect: onSelect, depth: depth + 1 }, child.path)))] }));
    }
    return (_jsxs("div", { onClick: () => onSelect(node.path), style: { paddingLeft: depth * 12 + 16, cursor: 'pointer' }, children: ["\uD83D\uDCDD ", node.name] }));
}
export function FileExplorer({ tree, onSelect }) {
    return (_jsx("div", { children: tree?.map((n) => (_jsx(Node, { node: n, onSelect: onSelect }, n.path))) }));
}
