import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const io = (global as any).__socket_io as import('socket.io').Server | undefined;
  const payload = {
    id: String(Date.now()),
    agent: 'ui',
    type: 'plan',
    payload: {
      routes: [{ route: '/' }],
      components: [{ name: 'Hero', path: '/components/Hero.tsx', props: {}, description: 'Landing hero' }],
      styles: [{ path: '/styles/globals.css' }],
      data: {}
    },
    ts: Date.now()
  };
  io?.emit('agent_event', payload);
  return Response.json({ ok: true, ux: payload.payload });
}


