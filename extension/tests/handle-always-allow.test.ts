import { describe, expect, it } from 'vitest';
import { evaluateFlow } from '../core/policy/evaluate';
import { listRules } from '../core/policy/repository';
import { handleAlwaysAllowMessage } from '../core/enforcement/handle-always-allow';
import { createMemoryArea } from './memory-area';

describe('handleAlwaysAllowMessage', () => {
  it('creates a rule that allows the exact flow going forward', async () => {
    const area = createMemoryArea();
    const result = await handleAlwaysAllowMessage(area, {
      type: 'agentfence:always-allow',
      source: { type: 'finance' },
      destination: { type: 'work' },
    });

    expect(result).toEqual({ ok: true });
    const rules = await listRules(area);
    expect(evaluateFlow({ type: 'finance' }, { type: 'work' }, rules).decision).toBe('allow');
  });

  it('ignores a message that is not an always-allow message', async () => {
    const area = createMemoryArea();
    expect(await handleAlwaysAllowMessage(area, { type: 'something-else' })).toBeUndefined();
    expect(await listRules(area)).toHaveLength((await listRules(createMemoryArea())).length);
  });
});
