import { describe, expect, it } from 'vitest';
import { assignSiteContext } from '../core/context/repository';
import { sha256Hex } from '../core/provenance/hash';
import { normalizeForHash } from '../core/provenance/normalize';
import { recordCopyEvent } from '../core/provenance/record-copy';
import { findProvenanceByHash } from '../core/provenance/store';
import { createMemoryArea } from './memory-area';

describe('recordCopyEvent', () => {
  it('hashes the normalized text, resolves the source context, and stores metadata only', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'bank.demo.test', { type: 'finance' });

    const entry = await recordCopyEvent(
      localArea,
      sessionArea,
      { text: '  ₹8,42,520  ', sourceDomain: 'bank.demo.test', sourceTabId: 7 },
      1_000,
    );

    expect(entry).toMatchObject({
      contentHash: await sha256Hex(normalizeForHash('  ₹8,42,520  ')),
      contentLength: normalizeForHash('  ₹8,42,520  ').length,
      sourceDomain: 'bank.demo.test',
      sourceContext: { type: 'finance' },
      sourceTabId: 7,
      capturedAt: 1_000,
      confidence: 'exact',
    });
    expect(await findProvenanceByHash(sessionArea, entry!.contentHash, 1_000)).toEqual(entry);
  });

  it('resolves unknown for a site with no assigned context', async () => {
    const entry = await recordCopyEvent(
      createMemoryArea(),
      createMemoryArea(),
      { text: 'hello', sourceDomain: 'nowhere.test' },
      1_000,
    );
    expect(entry?.sourceContext).toEqual({ type: 'unknown' });
  });

  it('records nothing for an empty or whitespace-only selection', async () => {
    const sessionArea = createMemoryArea();
    expect(
      await recordCopyEvent(createMemoryArea(), sessionArea, {
        text: '   ',
        sourceDomain: 'a.test',
      }),
    ).toBeUndefined();
    expect(await findProvenanceByHash(sessionArea, 'anything')).toBeUndefined();
  });
});
