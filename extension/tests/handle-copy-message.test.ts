import { describe, expect, it } from 'vitest';
import { assignSiteContext } from '../core/context/repository';
import { handleCopyMessage } from '../core/provenance/handle-copy-message';
import { listProvenance } from '../core/provenance/store';
import { createMemoryArea } from './memory-area';

describe('handleCopyMessage', () => {
  it('records a valid copy message', async () => {
    const localArea = createMemoryArea();
    const sessionArea = createMemoryArea();
    await assignSiteContext(localArea, 'chat.demo.test', { type: 'work' });

    const entry = await handleCopyMessage(
      localArea,
      sessionArea,
      { type: 'agentfence:copy', text: 'hello', href: 'https://chat.demo.test/thread/1' },
      42,
      1_000,
    );

    expect(entry).toMatchObject({
      sourceDomain: 'chat.demo.test',
      sourceContext: { type: 'work' },
      sourceTabId: 42,
    });
    expect(await listProvenance(sessionArea, 1_000)).toEqual([entry]);
  });

  it('ignores messages that are not a copy message', async () => {
    const sessionArea = createMemoryArea();
    expect(
      await handleCopyMessage(createMemoryArea(), sessionArea, { type: 'something-else' }, 1),
    ).toBeUndefined();
    expect(await handleCopyMessage(createMemoryArea(), sessionArea, undefined, 1)).toBeUndefined();
    expect(await listProvenance(sessionArea)).toEqual([]);
  });

  it('ignores a message whose href cannot be classified', async () => {
    const sessionArea = createMemoryArea();
    const entry = await handleCopyMessage(
      createMemoryArea(),
      sessionArea,
      { type: 'agentfence:copy', text: 'hello', href: 'not a url' },
      1,
    );
    expect(entry).toBeUndefined();
    expect(await listProvenance(sessionArea)).toEqual([]);
  });
});
