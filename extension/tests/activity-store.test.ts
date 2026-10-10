import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_RETENTION_MS,
  clearActivity,
  listActivity,
  pruneExpiredActivity,
  recordActivity,
} from '../core/activity/store';
import type { ActivityEntry } from '../core/activity/types';
import { createMemoryArea } from './memory-area';

function entry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: 1_000,
    sourceContext: { type: 'finance' },
    destinationContext: { type: 'work' },
    sourceDomain: 'bank.demo.test',
    destinationDomain: 'work-chat.demo.test',
    decision: 'ask',
    outcome: 'blocked',
    ruleId: 'default-finance-to-work',
    ...overrides,
  };
}

describe('activity store', () => {
  it('records and lists entries, most recent first', async () => {
    const area = createMemoryArea();
    const older = entry({ timestamp: 1_000 });
    const newer = entry({ timestamp: 2_000 });
    await recordActivity(area, older, 1_000);
    await recordActivity(area, newer, 2_000);

    expect(await listActivity(area, 2_000)).toEqual([newer, older]);
  });

  it('never stores the pasted text, only metadata', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry());
    const [stored] = await listActivity(area, 1_000);
    expect(Object.keys(stored!).sort()).toEqual(
      [
        'id',
        'timestamp',
        'sourceContext',
        'destinationContext',
        'sourceDomain',
        'destinationDomain',
        'decision',
        'outcome',
        'ruleId',
      ].sort(),
    );
  });

  it('expires entries after 7 days', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry({ timestamp: 0 }), 0);

    expect(await listActivity(area, ACTIVITY_RETENTION_MS - 1)).toHaveLength(1);
    expect(await listActivity(area, ACTIVITY_RETENTION_MS)).toEqual([]);
  });

  it('prunes expired entries from storage, not just from reads', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry({ timestamp: 0 }), 0);
    await recordActivity(area, entry({ timestamp: 0 }), 0);

    const remaining = await pruneExpiredActivity(area, ACTIVITY_RETENTION_MS + 1);
    expect(remaining).toEqual([]);
  });

  it('drops expired entries automatically when a new one is recorded', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry({ timestamp: 0 }), 0);
    await recordActivity(
      area,
      entry({ timestamp: ACTIVITY_RETENTION_MS + 1 }),
      ACTIVITY_RETENTION_MS + 1,
    );

    expect(await listActivity(area, ACTIVITY_RETENTION_MS + 1)).toHaveLength(1);
  });

  it('clears all history', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry());
    await recordActivity(area, entry());
    await clearActivity(area);

    expect(await listActivity(area)).toEqual([]);
  });
});
