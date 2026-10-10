import { loadState, saveState, type KeyValueArea } from '../storage/state-store';
import type { ActivityEntry } from './types';

export const ACTIVITY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function notExpired(entry: ActivityEntry, now: number): boolean {
  return now - entry.timestamp < ACTIVITY_RETENTION_MS;
}

/** Records one completed paste decision, dropping anything past the 7-day retention window. */
export async function recordActivity(
  area: KeyValueArea,
  entry: ActivityEntry,
  now: number = entry.timestamp,
): Promise<void> {
  const state = await loadState(area);
  const activityHistory = [
    ...state.activityHistory.filter((existing) => notExpired(existing, now)),
    entry,
  ];
  await saveState(area, { ...state, activityHistory });
}

/** Most recent first. */
export async function listActivity(
  area: KeyValueArea,
  now: number = Date.now(),
): Promise<ActivityEntry[]> {
  const state = await loadState(area);
  return state.activityHistory
    .filter((entry) => notExpired(entry, now))
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Drops anything past retention and returns what is left, most recent first. */
export async function pruneExpiredActivity(
  area: KeyValueArea,
  now: number = Date.now(),
): Promise<ActivityEntry[]> {
  const state = await loadState(area);
  const activityHistory = state.activityHistory.filter((entry) => notExpired(entry, now));
  await saveState(area, { ...state, activityHistory });
  return [...activityHistory].sort((a, b) => b.timestamp - a.timestamp);
}

export async function clearActivity(area: KeyValueArea): Promise<void> {
  const state = await loadState(area);
  await saveState(area, { ...state, activityHistory: [] });
}
