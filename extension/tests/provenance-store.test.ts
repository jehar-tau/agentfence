import { describe, expect, it } from 'vitest';
import {
  PROVENANCE_STORAGE_KEY,
  PROVENANCE_TTL_MS,
  findProvenanceByHash,
  listProvenance,
  pruneExpiredProvenance,
  recordProvenance,
} from '../core/provenance/store';
import type { ProvenanceEntry } from '../core/provenance/types';
import { createMemoryArea } from './memory-area';

function entry(overrides: Partial<ProvenanceEntry> = {}): ProvenanceEntry {
  return {
    id: crypto.randomUUID(),
    contentHash: 'hash-a',
    contentLength: 10,
    sourceDomain: 'bank.demo.test',
    sourceContext: { type: 'finance' },
    sourceTabId: 1,
    capturedAt: 1_000,
    confidence: 'exact',
    ...overrides,
  };
}

describe('provenance store', () => {
  it('records and finds an entry by hash', async () => {
    const area = createMemoryArea();
    const e = entry();
    await recordProvenance(area, e);

    expect(await findProvenanceByHash(area, 'hash-a', e.capturedAt + 1000)).toEqual(e);
    expect(await findProvenanceByHash(area, 'hash-b', e.capturedAt + 1000)).toBeUndefined();
  });

  it('never stores raw text, only the fields in the type', async () => {
    const area = createMemoryArea();
    await recordProvenance(area, entry());
    const stored = (area.data[PROVENANCE_STORAGE_KEY] as ProvenanceEntry[])[0]!;
    expect(Object.keys(stored).sort()).toEqual(
      [
        'id',
        'contentHash',
        'contentLength',
        'sourceDomain',
        'sourceContext',
        'sourceTabId',
        'capturedAt',
        'confidence',
      ].sort(),
    );
  });

  it('returns the most recently captured match when several share a hash', async () => {
    const area = createMemoryArea();
    const older = entry({ capturedAt: 1_000, sourceDomain: 'a.test' });
    const newer = entry({ capturedAt: 2_000, sourceDomain: 'b.test' });
    await recordProvenance(area, older);
    await recordProvenance(area, newer);

    expect(await findProvenanceByHash(area, 'hash-a', 3_000)).toEqual(newer);
  });

  it('expires entries after the TTL', async () => {
    const area = createMemoryArea();
    const e = entry({ capturedAt: 0 });
    await recordProvenance(area, e);

    expect(await findProvenanceByHash(area, 'hash-a', PROVENANCE_TTL_MS - 1)).toEqual(e);
    expect(await findProvenanceByHash(area, 'hash-a', PROVENANCE_TTL_MS)).toBeUndefined();
  });

  it('prunes expired entries from storage, not just from reads', async () => {
    const area = createMemoryArea();
    await recordProvenance(area, entry({ capturedAt: 0 }));
    await recordProvenance(area, entry({ capturedAt: 0, contentHash: 'hash-c' }));

    const remaining = await pruneExpiredProvenance(area, PROVENANCE_TTL_MS + 1);
    expect(remaining).toEqual([]);
    expect(area.data[PROVENANCE_STORAGE_KEY]).toEqual([]);
  });

  it('drops expired entries automatically when a new one is recorded', async () => {
    const area = createMemoryArea();
    await recordProvenance(area, entry({ capturedAt: 0 }));
    await recordProvenance(
      area,
      entry({ capturedAt: PROVENANCE_TTL_MS + 1, contentHash: 'hash-c' }),
    );

    const all = await listProvenance(area, PROVENANCE_TTL_MS + 1);
    expect(all).toHaveLength(1);
    expect(all[0]?.contentHash).toBe('hash-c');
  });

  it('ignores malformed stored data instead of throwing', async () => {
    const area = createMemoryArea({ [PROVENANCE_STORAGE_KEY]: 'not an array' });
    expect(await listProvenance(area)).toEqual([]);

    const area2 = createMemoryArea({ [PROVENANCE_STORAGE_KEY]: [{ nonsense: true }] });
    expect(await listProvenance(area2)).toEqual([]);
  });
});
