import React from 'react';
let socket = null;
const agentSubscribers = new Set();
const fileSubscribers = new Set();
function ensureSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))
        return socket;
    const env = import.meta.env || {};
    const overrideUrl = env.VITE_WS_URL;
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    let wsUrl = `ws://localhost:${env.VITE_WS_PORT || 3002}`;
    if (overrideUrl) {
        wsUrl = overrideUrl;
    }
    else if (isProd) {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsUrl = `${protocol}://${window.location.host}`;
    }
    socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'agent_update') {
            for (const sub of agentSubscribers)
                sub((prev) => [...prev, { agent: msg.agent, status: msg.status, message: msg.message, data: msg.data }]);
        }
        if (msg.type === 'file_event') {
            const fe = { type: 'file_event', event: msg.event, projectId: msg.projectId, filePath: msg.filePath };
            for (const sub of fileSubscribers)
                sub((prev) => [...prev, fe]);
        }
    };
    return socket;
}
export function useWebSocket() {
    const [agentUpdates, setAgentUpdates] = React.useState([]);
    const [fileEvents, setFileEvents] = React.useState([]);
    React.useEffect(() => {
        agentSubscribers.add(setAgentUpdates);
        fileSubscribers.add(setFileEvents);
        ensureSocket();
        return () => {
            agentSubscribers.delete(setAgentUpdates);
            fileSubscribers.delete(setFileEvents);
        };
    }, []);
    const send = React.useCallback((payload) => {
        const s = ensureSocket();
        const trySend = () => {
            if (s.readyState === WebSocket.OPEN)
                s.send(JSON.stringify(payload));
            else
                setTimeout(trySend, 100);
        };
        trySend();
    }, []);
    return { agentUpdates, fileEvents, send };
}
