import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useWebSocket } from '../hooks/useWebSocket';
export function AgentStatus() {
    const { agentUpdates, fileEvents } = useWebSocket();
    return (_jsxs("div", { className: "p-2 border-t overflow-auto bg-white", children: [_jsx("div", { className: "font-semibold mb-1", children: "Agent Activity" }), _jsxs("div", { className: "max-h-56 overflow-auto text-xs space-y-1", children: [agentUpdates.slice(-50).map((u, idx) => (_jsxs("div", { className: "whitespace-pre-wrap", children: [_jsxs("span", { className: "font-medium", children: ["[", u.agent, "]"] }), " ", u.status, ": ", u.message] }, idx))), _jsx("div", { className: "mt-2 font-semibold", children: "File Events" }), fileEvents.slice(-50).map((e, idx) => (_jsxs("div", { className: "whitespace-pre-wrap", children: [e.event, " ", e.projectId, "/", e.filePath] }, idx)))] })] }));
}
