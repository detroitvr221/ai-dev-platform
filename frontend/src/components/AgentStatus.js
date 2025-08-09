import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useWebSocket } from '../hooks/useWebSocket';
export function AgentStatus() {
    const { agentUpdates, fileEvents } = useWebSocket();
    return (_jsxs("div", { style: { padding: 8, borderTop: '1px solid #eee', overflow: 'auto' }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: 6 }, children: "Agent Activity" }), _jsxs("div", { style: { maxHeight: 220, overflow: 'auto', fontSize: 12 }, children: [agentUpdates.slice(-50).map((u, idx) => (_jsxs("div", { children: ["[", u.agent, "] ", u.status, ": ", u.message] }, idx))), _jsx("div", { style: { marginTop: 8, fontWeight: 600 }, children: "File Events" }), fileEvents.slice(-50).map((e, idx) => (_jsxs("div", { children: [e.event, " ", e.projectId, "/", e.filePath] }, idx)))] })] }));
}
