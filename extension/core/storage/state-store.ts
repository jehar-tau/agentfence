import { STORAGE_KEY, migrate, type StoredState } from './schema';

/** The subset of chrome.storage.local that AgentFence uses, so tests can substitute a fake. */
export interface KeyValueArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** Reads state, migrating and writing it back if it was stored by an older schema. */
export async function loadState(area: KeyValueArea): Promise<StoredState> {
  const raw = (await area.get(STORAGE_KEY))[STORAGE_KEY];
  const state = migrate(raw);
  const storedVersion = (raw as { schemaVersion?: unknown } | undefined)?.schemaVersion;
  if (storedVersion !== state.schemaVersion) await saveState(area, state);
  return state;
}

export async function saveState(area: KeyValueArea, state: StoredState): Promise<void> {
  await area.set({ [STORAGE_KEY]: state });
}
