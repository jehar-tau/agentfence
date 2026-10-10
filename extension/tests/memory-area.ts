import type { KeyValueArea } from '../core/storage/state-store';

/** In-memory stand-in for chrome.storage.local. Values are cloned like the real API does. */
export function createMemoryArea(
  initial: Record<string, unknown> = {},
): KeyValueArea & { data: Record<string, unknown>; writes: number } {
  const area = {
    data: structuredClone(initial),
    writes: 0,
    async get(key: string) {
      return key in area.data ? { [key]: structuredClone(area.data[key]) } : {};
    },
    async set(items: Record<string, unknown>) {
      area.writes++;
      Object.assign(area.data, structuredClone(items));
    },
  };
  return area;
}
