import type { KeyValueArea } from '../storage/state-store';
import type { ProvenanceEntry } from './types';

export const PROVENANCE_STORAGE_KEY = 'agentfence:provenance';
export const PROVENANCE_TTL_MS = 15 * 60 * 1000;

function isProvenanceEntry(value: unknown): value is ProvenanceEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.contentHash === 'string' &&
    typeof entry.contentLength === 'number' &&
    typeof entry.sourceDomain === 'string' &&
    typeof entry.capturedAt === 'number' &&
    typeof entry.confidence === 'string' &&
    typeof entry.sourceContext === 'object' &&
    entry.sourceContext !== null
  );
}

async function readEntries(area: KeyValueArea): Promise<ProvenanceEntry[]> {
  const raw = (await area.get(PROVENANCE_STORAGE_KEY))[PROVENANCE_STORAGE_KEY];
  return Array.isArray(raw) ? raw.filter(isProvenanceEntry) : [];
}

function notExpired(entry: ProvenanceEntry, now: number): boolean {
  return now - entry.capturedAt < PROVENANCE_TTL_MS;
}

/** Drops expired entries and returns what is left. Safe to call at any time. */
export async function pruneExpiredProvenance(
  area: KeyValueArea,
  now: number = Date.now(),
): Promise<ProvenanceEntry[]> {
  const entries = (await readEntries(area)).filter((entry) => notExpired(entry, now));
  await area.set({ [PROVENANCE_STORAGE_KEY]: entries });
  return entries;
}

/** Records a new entry, pruning expired ones in the same write. */
export async function recordProvenance(area: KeyValueArea, entry: ProvenanceEntry): Promise<void> {
  const entries = (await readEntries(area)).filter((existing) =>
    notExpired(existing, entry.capturedAt),
  );
  entries.push(entry);
  await area.set({ [PROVENANCE_STORAGE_KEY]: entries });
}

/** The most recently captured, non-expired entry with this exact hash, if any. */
export async function findProvenanceByHash(
  area: KeyValueArea,
  contentHash: string,
  now: number = Date.now(),
): Promise<ProvenanceEntry | undefined> {
  const entries = (await readEntries(area)).filter((entry) => notExpired(entry, now));
  return entries
    .filter((entry) => entry.contentHash === contentHash)
    .sort((a, b) => b.capturedAt - a.capturedAt)[0];
}

export async function listProvenance(
  area: KeyValueArea,
  now: number = Date.now(),
): Promise<ProvenanceEntry[]> {
  return (await readEntries(area)).filter((entry) => notExpired(entry, now));
}
