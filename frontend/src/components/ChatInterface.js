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
    return (_jsxs("div", { className: "grid grid-rows-[1fr_auto] h-full", children: [_jsx("div", { className: "p-2 overflow-auto space-y-1 text-sm", children: agentUpdates.map((u, i) => (_jsxs("div", { children: [_jsxs("strong", { children: ["[", u.agent, "]"] }), " ", u.status, " \u2014 ", u.message] }, i))) }), _jsxs("div", { className: "flex gap-2 p-2 border-t", children: [_jsx("input", { className: "flex-1 border rounded px-2 py-1", value: input, onChange: (e) => setInput(e.target.value), placeholder: !selectedProjectId ? 'Create/select a project first' : 'Describe what to build...' }), _jsx("button", { className: "px-3 py-1 rounded bg-black text-white", onClick: onSend, disabled: !selectedProjectId || !input.trim(), children: "Send" })] })] }));
}
