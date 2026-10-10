import { describe, expect, it } from 'vitest';
import { assignSiteContext } from '../core/context/repository';
import { evaluatePaste } from '../core/enforcement/evaluate-paste';
import { recordCopyEvent } from '../core/provenance/record-copy';
import { createMemoryArea } from './memory-area';

describe('evaluatePaste', () => {
  it('matches a recent exact copy and evaluates the flow it describes', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(localArea, 'work-chat.demo.test', { type: 'work' });
    await recordCopyEvent(
      localArea,
      sessionArea,
      { text: '8,42,520', sourceDomain: 'bank.demo.test', sourceTabId: 1 },
      1_000,
    );

    const result = await evaluatePaste(
      localArea,
      sessionArea,
      { text: '8,42,520', href: 'https://work-chat.demo.test/thread' },
      2_000,
    );

    expect(result).toMatchObject({
      decision: 'ask',
      sourceContext: { type: 'finance' },
      destinationContext: { type: 'work' },
      sourceDomain: 'bank.demo.test',
      confidence: 'exact',
    });
  });

  it('blocks a client-to-client paste using recorded provenance', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'client-a.demo.test', { type: 'client', scope: 'acme' });
    await assignSiteContext(localArea, 'client-b.demo.test', { type: 'client', scope: 'globex' });
    await recordCopyEvent(
      localArea,
      sessionArea,
      { text: 'confidential price', sourceDomain: 'client-a.demo.test' },
      1_000,
    );

    const result = await evaluatePaste(
      localArea,
      sessionArea,
      { text: 'confidential price', href: 'https://client-b.demo.test/' },
      2_000,
    );
    expect(result?.decision).toBe('block');
  });

  it('treats text with no matching provenance as an unknown source, never guessing it', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'work-chat.demo.test', { type: 'work' });

    const result = await evaluatePaste(
      localArea,
      sessionArea,
      { text: 'typed directly, never copied', href: 'https://work-chat.demo.test/' },
      1_000,
    );

    expect(result).toMatchObject({
      decision: 'ask',
      sourceContext: { type: 'unknown' },
      confidence: 'unknown',
      sourceDomain: undefined,
    });
  });

  it('does not match provenance that has expired', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(localArea, 'work-chat.demo.test', { type: 'work' });
    await recordCopyEvent(
      localArea,
      sessionArea,
      { text: 'old balance', sourceDomain: 'bank.demo.test' },
      0,
    );

    const result = await evaluatePaste(
      localArea,
      sessionArea,
      { text: 'old balance', href: 'https://work-chat.demo.test/' },
      16 * 60 * 1000,
    );
    expect(result?.sourceContext).toEqual({ type: 'unknown' });
  });

  it('allows a same-context paste seamlessly', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'bank.demo.test', { type: 'finance' });
    await recordCopyEvent(
      localArea,
      sessionArea,
      { text: 'x', sourceDomain: 'bank.demo.test' },
      1_000,
    );

    const result = await evaluatePaste(
      localArea,
      sessionArea,
      { text: 'x', href: 'https://bank.demo.test/transfer' },
      1_500,
    );
    expect(result?.decision).toBe('allow');
  });

  it('returns undefined for a destination that cannot be classified', async () => {
    const result = await evaluatePaste(
      createMemoryArea(),
      createMemoryArea(),
      { text: 'x', href: 'not a url' },
      1_000,
    );
    expect(result).toBeUndefined();
  });
});
