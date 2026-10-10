import { describe, expect, it } from 'vitest';
import { handleRecordActivityMessage } from '../core/enforcement/handle-record-activity';
import { listActivity } from '../core/activity/store';
import { createMemoryArea } from './memory-area';

describe('handleRecordActivityMessage', () => {
  it('records a well-formed message into activity history', async () => {
    const area = createMemoryArea();
    const result = await handleRecordActivityMessage(
      area,
      {
        type: 'agentfence:record-activity',
        sourceContext: { type: 'finance' },
        destinationContext: { type: 'work' },
        sourceDomain: 'bank.demo.test',
        destinationDomain: 'work-chat.demo.test',
        decision: 'ask',
        outcome: 'blocked',
        ruleId: 'default-finance-to-work',
      },
      1_000,
    );

    expect(result).toEqual({ ok: true });
    const [recorded] = await listActivity(area, 1_000);
    expect(recorded).toMatchObject({
      sourceContext: { type: 'finance' },
      destinationContext: { type: 'work' },
      sourceDomain: 'bank.demo.test',
      destinationDomain: 'work-chat.demo.test',
      decision: 'ask',
      outcome: 'blocked',
      ruleId: 'default-finance-to-work',
      timestamp: 1_000,
    });
  });

  it('ignores a message that is not a record-activity message', async () => {
    const area = createMemoryArea();
    expect(await handleRecordActivityMessage(area, { type: 'something-else' })).toBeUndefined();
    expect(await listActivity(area)).toEqual([]);
  });
});
