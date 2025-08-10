import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}));
  const io = (global as any).__socket_io as import('socket.io').Server | undefined;
  const payload = {
    id: String(Date.now()),
    agent: 'planner',
    type: 'plan',
    payload: {
      app_name: 'Demo App',
      goals: ['Generate scaffold', 'Show live preview'],
      core_entities: ['Page', 'Component'],
      pages: [{ name: 'Home', route: '/', purpose: 'Landing', primary_components: ['Hero', 'Footer'] }],
      user_stories: ['As a user, I see a landing page']
    },
    ts: Date.now()
  };
  io?.emit('agent_event', payload);
  return Response.json({ ok: true, plan: payload.payload });
}


