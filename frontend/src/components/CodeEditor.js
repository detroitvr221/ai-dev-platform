import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Editor from '@monaco-editor/react';
function languageFromPath(filePath) {
    if (!filePath)
        return 'markdown';
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
        return 'typescript';
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx'))
        return 'javascript';
    if (filePath.endsWith('.json'))
        return 'json';
    if (filePath.endsWith('.css'))
        return 'css';
    if (filePath.endsWith('.html'))
        return 'html';
    if (filePath.endsWith('.md'))
        return 'markdown';
    return 'plaintext';
}
export function CodeEditor({ filePath, value, onChange, onSave }) {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { padding: '6px 8px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("strong", { style: { flex: 1 }, children: filePath || 'No file selected' }), _jsx("button", { onClick: () => onSave(value), children: "Save" })] }), _jsx("div", { style: { height: '100%', minHeight: 300 }, children: _jsx(Editor, { height: "100%", language: languageFromPath(filePath), value: value, onChange: (v) => onChange(v ?? ''), theme: "vs-dark", options: { fontSize: 14 } }) })] }));
}
