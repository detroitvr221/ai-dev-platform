import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { CheckCircle2, XCircle, Loader2, Bot, Code2, Database, TestTube2, Container, Layout } from 'lucide-react';
const agentMeta = {
    planning: { label: 'Planning', icon: _jsx(Bot, { className: "w-4 h-4" }), color: 'from-violet-500 to-fuchsia-500' },
    frontend: { label: 'Frontend', icon: _jsx(Layout, { className: "w-4 h-4" }), color: 'from-sky-500 to-cyan-500' },
    backend: { label: 'Backend', icon: _jsx(Code2, { className: "w-4 h-4" }), color: 'from-emerald-500 to-teal-500' },
    database: { label: 'Database', icon: _jsx(Database, { className: "w-4 h-4" }), color: 'from-amber-500 to-orange-500' },
    testing: { label: 'Testing', icon: _jsx(TestTube2, { className: "w-4 h-4" }), color: 'from-pink-500 to-rose-500' },
    devops: { label: 'DevOps', icon: _jsx(Container, { className: "w-4 h-4" }), color: 'from-indigo-500 to-purple-500' },
};
function StatusIcon({ status }) {
    if (status === 'completed')
        return _jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-600" });
    if (status === 'error')
        return _jsx(XCircle, { className: "w-4 h-4 text-rose-600" });
    if (status === 'started' || status === 'progress')
        return _jsx(Loader2, { className: "w-4 h-4 animate-spin text-zinc-500" });
    return _jsx("span", { className: "w-4 h-4 inline-block rounded-full bg-zinc-300" });
}
export function AgentProgress() {
    const { agentUpdates } = useWebSocket();
    const latestByAgent = React.useMemo(() => {
        const map = new Map();
        for (const u of agentUpdates) {
            if (!u.agent)
                continue;
            const key = u.agent;
            if (!agentMeta[key])
                continue;
            map.set(key, { status: u.status, message: u.message });
        }
        return map;
    }, [agentUpdates]);
    const planningTasks = React.useMemo(() => {
        // try to find last planning completion that contains tasks
        for (let i = agentUpdates.length - 1; i >= 0; i--) {
            const u = agentUpdates[i];
            if (u.agent === 'planning' && u.status === 'completed' && u.data && (u.data.data?.tasks || u.data.tasks)) {
                const tasks = (u.data.data?.tasks || u.data.tasks);
                if (Array.isArray(tasks))
                    return tasks;
            }
        }
        return [];
    }, [agentUpdates]);
    return (_jsxs("div", { className: "h-full overflow-auto p-3 bg-gradient-to-b from-zinc-50 to-white", children: [_jsx("div", { className: "grid grid-cols-1 gap-3", children: Object.keys(agentMeta).map((k) => {
                    const meta = agentMeta[k];
                    const latest = latestByAgent.get(k);
                    const status = latest?.status || 'idle';
                    const message = latest?.message || 'Waiting';
                    return (_jsxs("div", { className: "rounded-lg border bg-white p-3 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `p-1.5 rounded-md bg-gradient-to-r ${meta.color} text-white`, children: meta.icon }), _jsx("div", { className: "font-medium text-sm", children: meta.label })] }), _jsx(StatusIcon, { status: status })] }), _jsx("div", { className: "mt-2 text-xs text-zinc-600 line-clamp-2", children: message }), _jsx("div", { className: "mt-3 h-1.5 rounded bg-zinc-100 overflow-hidden", children: _jsx("div", { className: `h-full transition-all bg-gradient-to-r ${meta.color}`, style: { width: status === 'completed' ? '100%' : status === 'started' || status === 'progress' ? '50%' : status === 'error' ? '100%' : '4%', opacity: status === 'error' ? 0.4 : 1 } }) })] }, k));
                }) }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "text-sm font-semibold mb-2", children: "Planned Tasks" }), planningTasks.length === 0 ? (_jsx("div", { className: "text-xs text-zinc-500", children: "No tasks yet. Ask for a plan or start a build." })) : (_jsx("div", { className: "space-y-2", children: planningTasks.map((t, idx) => (_jsxs("div", { className: "rounded border bg-white p-2 text-xs", children: [_jsx("div", { className: "font-medium", children: t.title || t.id }), _jsx("div", { className: "text-zinc-600", children: t.description }), _jsxs("div", { className: "mt-1 text-zinc-500", children: ["Assignee: ", t.assignee || 'auto', Array.isArray(t.dependsOn) && t.dependsOn.length ? ` • Depends: ${t.dependsOn.join(', ')}` : ''] })] }, idx))) }))] })] }));
}
