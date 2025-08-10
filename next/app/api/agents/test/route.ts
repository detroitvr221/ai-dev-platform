import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const io = (global as any).__socket_io as import('socket.io').Server | undefined;
  const payload = { id: String(Date.now()), agent: 'tester', type: 'status', payload: 'No issues found (stub)', ts: Date.now() };
  io?.emit('agent_event', payload);
  return Response.json({ ok: true, result: 'No issues (stub)' });
}


