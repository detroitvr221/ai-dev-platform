import { get, set } from 'idb-keyval';

export type PersistedState = {
  files: Record<string, { content: string; language: string }>;
  activePath: string;
};

const KEY = 'novacode-simple-ui';

export async function loadState(): Promise<PersistedState | undefined> {
  try {
    const data = await get<PersistedState>(KEY);
    return data || undefined;
  } catch {
    return undefined;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await set(KEY, state);
}


