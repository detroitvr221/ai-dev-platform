import { useProjectStore } from '../state/useProjectStore';
import { dirname, joinPath } from '../utils/path';

export function createNewFilePath(baseDir: string, baseName = 'untitled', ext = 'txt', existing: Set<string>): string {
  let i = 0;
  while (true) {
    const name = i === 0 ? `${baseName}.${ext}` : `${baseName}-${i}.${ext}`;
    const path = joinPath(baseDir, name);
    if (!existing.has(path)) return path;
    i++;
  }
}

export function movePath(oldPath: string, newDir: string, newName?: string): { oldPath: string; newPath: string } {
  const name = newName || oldPath.split('/').pop()!;
  return { oldPath, newPath: joinPath(newDir, name) };
}


