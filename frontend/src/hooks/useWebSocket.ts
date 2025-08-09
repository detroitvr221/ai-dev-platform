import React from 'react';

type Update = { agent: string; status: string; message?: string; data?: any };

let socket: WebSocket | null = null;
const subscribers = new Set<React.Dispatch<React.SetStateAction<Update[]>>>();

function ensureSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return socket;
  const env: any = (import.meta as any).env || {};
  const overrideUrl = env.VITE_WS_URL as string | undefined;
  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  let wsUrl = `ws://localhost:${env.VITE_WS_PORT || 3002}`;
  if (overrideUrl) {
    wsUrl = overrideUrl;
  } else if (isProd) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    wsUrl = `${protocol}://${window.location.host}`;
  }
  socket = new WebSocket(wsUrl);
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'agent_update') {
      for (const sub of subscribers) sub((prev) => [...prev, { agent: msg.agent, status: msg.status, message: msg.message, data: msg.data }]);
    }
  };
  return socket;
}

export function useWebSocket() {
  const [agentUpdates, setAgentUpdates] = React.useState<Update[]>([]);
  React.useEffect(() => {
    subscribers.add(setAgentUpdates);
    ensureSocket();
    return () => {
      subscribers.delete(setAgentUpdates);
    };
  }, []);

  const send = React.useCallback((payload: any) => {
    const s = ensureSocket();
    const trySend = () => {
      if (s.readyState === WebSocket.OPEN) s.send(JSON.stringify(payload));
      else setTimeout(trySend, 100);
    };
    trySend();
  }, []);

  return { agentUpdates, send };
}

