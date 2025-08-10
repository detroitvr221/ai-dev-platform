import { get, set } from 'idb-keyval';
import type { ProjectState } from './useProjectStore';

const KEY = 'monaco-no-code-project-state';

export async function loadProjectState(): Promise<ProjectState | undefined> {
  try {
    const data = await get<ProjectState>(KEY);
    return data || undefined;
  } catch {
    return undefined;
  }
}

export async function persistProjectState(state: ProjectState): Promise<void> {
  await set(KEY, state);
}


