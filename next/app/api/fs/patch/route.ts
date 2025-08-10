import { NextRequest } from 'next/server';
import { Server } from 'socket.io';

const memFS: { files: Record<string, { content: string; language: string }> } = (global as any).__memfs || ((global as any).__memfs = { files: {} });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>null);
  if (!body?.files) return new Response('invalid body', { status: 400 });
  // Apply simple replace patches (stub). For real DMP, parse and apply diffs.
  for (const f of body.files as Array<{ path: string; patch: string }>) {
    const isNew = !memFS.files[f.path];
    const content = f.patch.replace(/^@@[\s\S]*?@@\n?/, '');
    memFS.files[f.path] = { content, language: guessLang(f.path) };
  }
  const io = (global as any).__socket_io as Server | undefined;
  io?.emit('fs_update', { files: Object.keys(memFS.files) });
  return Response.json({ ok: true });
}

function guessLang(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) { case 'html': return 'html'; case 'css': return 'css'; case 'json': return 'json'; default: return 'javascript'; }
}


