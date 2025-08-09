import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProjectList({ projects, onSelect, onCreate }) {
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("div", { style: { fontWeight: 600 }, children: "Projects" }), _jsx("button", { onClick: onCreate, children: "New" })] }), _jsx("ul", { children: projects.map((p) => (_jsx("li", { children: _jsx("button", { onClick: () => onSelect(p.id), children: p.name }) }, p.id))) })] }));
}
