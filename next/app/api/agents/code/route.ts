import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const io = (global as any).__socket_io as import('socket.io').Server | undefined;
  const patch = {
    description: 'Create Hero component',
    files: [
      { path: '/components/Hero.tsx', patch: '@@ -0,0 +1,5 @@\n+export default function Hero(){\n+  return <div>Hero</div>\n+}\n' }
    ]
  };
  const payload = { id: String(Date.now()), agent: 'coder', type: 'patch', payload: patch, ts: Date.now() };
  io?.emit('agent_event', payload);
  return Response.json({ ok: true, patch });
}


