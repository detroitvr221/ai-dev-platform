import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
export function ChatInterface({ selectedProjectId }) {
    const { send, agentUpdates } = useWebSocket();
    const [input, setInput] = useState('');
    const onSend = () => {
        if (!selectedProjectId)
            return;
        send({ type: 'user_message', text: input, projectId: selectedProjectId });
        setInput('');
    };
    return (_jsxs("div", { style: { display: 'grid', gridTemplateRows: '1fr auto' }, children: [_jsx("div", { style: { padding: 8, overflow: 'auto' }, children: agentUpdates.map((u, i) => (_jsxs("div", { style: { fontSize: 12, marginBottom: 6 }, children: [_jsxs("strong", { children: ["[", u.agent, "]"] }), " ", u.status, " \u2014 ", u.message] }, i))) }), _jsxs("div", { style: { display: 'flex', gap: 8, padding: 8, borderTop: '1px solid #eee' }, children: [_jsx("input", { style: { flex: 1 }, value: input, onChange: (e) => setInput(e.target.value), placeholder: !selectedProjectId ? 'Create/select a project first' : 'Describe what to build...' }), _jsx("button", { onClick: onSend, disabled: !selectedProjectId || !input.trim(), children: "Send" })] })] }));
}
