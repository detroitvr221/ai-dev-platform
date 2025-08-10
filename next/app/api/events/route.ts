import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // The actual Socket.IO server is bound in the Next server runtime; this route exists for readiness
  return new Response('ok');
}


