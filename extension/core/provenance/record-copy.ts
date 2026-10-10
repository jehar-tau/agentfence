import { getSiteContext } from '../context/repository';
import type { KeyValueArea } from '../storage/state-store';
import { sha256Hex } from './hash';
import { normalizeForHash } from './normalize';
import { recordProvenance } from './store';
import type { ProvenanceEntry } from './types';

export interface CopyEvent {
  text: string;
  sourceDomain: string;
  sourceTabId?: number;
}

/**
 * Normalizes and hashes copied text, resolves its source context, and stores only
 * metadata — never the raw text. Returns undefined if there is nothing worth recording,
 * e.g. an empty selection.
 */
export async function recordCopyEvent(
  localArea: KeyValueArea,
  sessionArea: KeyValueArea,
  event: CopyEvent,
  now: number = Date.now(),
): Promise<ProvenanceEntry | undefined> {
  const normalized = normalizeForHash(event.text);
  if (!normalized) return undefined;

  const [contentHash, sourceContext] = await Promise.all([
    sha256Hex(normalized),
    getSiteContext(localArea, event.sourceDomain),
  ]);

  const entry: ProvenanceEntry = {
    id: crypto.randomUUID(),
    contentHash,
    contentLength: normalized.length,
    sourceDomain: event.sourceDomain,
    sourceContext,
    sourceTabId: event.sourceTabId,
    capturedAt: now,
    confidence: 'exact',
  };
  await recordProvenance(sessionArea, entry);
  return entry;
}
