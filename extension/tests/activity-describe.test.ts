import { describe, expect, it } from 'vitest';
import { describeOutcome } from '../core/activity/describe';

describe('describeOutcome', () => {
  it('labels a seamless allow', () => {
    expect(describeOutcome({ decision: 'allow', outcome: 'allowed' })).toBe('Allowed');
  });

  it('labels a block', () => {
    expect(describeOutcome({ decision: 'block', outcome: 'blocked' })).toBe('Blocked');
  });

  it('labels an ask the user blocked, matching the spec example exactly', () => {
    expect(describeOutcome({ decision: 'ask', outcome: 'blocked' })).toBe('Asked · user blocked');
  });

  it('labels an ask the user allowed once or always', () => {
    expect(describeOutcome({ decision: 'ask', outcome: 'allowed-once' })).toBe(
      'Asked · user allowed once',
    );
    expect(describeOutcome({ decision: 'ask', outcome: 'always-allowed' })).toBe(
      'Asked · user chose always allow',
    );
  });
});
