const memFS: { files: Record<string, { content: string; language: string }> } = (global as any).__memfs || ((global as any).__memfs = { files: {} });

export async function GET() {
  const files = Object.keys(memFS.files);
  return Response.json({ files });
}


