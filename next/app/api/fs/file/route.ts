import { NextRequest } from 'next/server';
const memFS: { files: Record<string, { content: string; language: string }> } = (global as any).__memfs || ((global as any).__memfs = { files: {} });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) return new Response('path required', { status: 400 });
  return Response.json(memFS.files[path] || null);
}


