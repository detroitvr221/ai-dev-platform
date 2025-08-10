import { Server } from 'socket.io';

let io: Server | undefined;

export function getIO(httpServer: any): Server {
  if (!io) {
    io = new Server(httpServer, { path: '/socket.io', cors: { origin: '*' } });
    // Expose globally for route handlers to emit events
    (global as any).__socket_io = io;
    io.on('connection', (socket) => {
      socket.emit('agent_event', { id: 'hello', agent: 'system', type: 'status', payload: 'connected', ts: Date.now() });
      socket.on('chat:user', (msg) => {
        // Echo stub agent response
        setTimeout(() => {
          socket.emit('agent_event', { id: String(Date.now()), agent: 'planner', type: 'answer', payload: `You said: ${msg?.text || ''}`, ts: Date.now() });
        }, 300);
      });
    });
  }
  return io;
}


