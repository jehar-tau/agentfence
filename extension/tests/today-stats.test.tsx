// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { recordActivity } from '../core/activity/store';
import type { ActivityEntry } from '../core/activity/types';
import { TodayStats } from '../entrypoints/popup/TodayStats';
import { createMemoryArea } from './memory-area';

afterEach(cleanup);

function entry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    sourceContext: { type: 'finance' },
    destinationContext: { type: 'work' },
    destinationDomain: 'work-chat.demo.test',
    decision: 'block',
    outcome: 'blocked',
    ...overrides,
  };
}

describe('TodayStats', () => {
  it('renders nothing when there is no activity today', async () => {
    const { container } = render(<TodayStats area={createMemoryArea()} />);
    await waitFor(() => expect(container.textContent).toBe(''));
  });

  it('counts blocked and asked entries from today', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry({ decision: 'block' }));
    await recordActivity(area, entry({ decision: 'ask', outcome: 'allowed-once' }));
    await recordActivity(area, entry({ decision: 'ask', outcome: 'blocked' }));
    await recordActivity(area, entry({ decision: 'allow', outcome: 'allowed' }));

    render(<TodayStats area={area} />);
    await waitFor(() => expect(screen.getByText('Today: 1 blocked, 2 asked')).toBeTruthy());
  });

  it('does not count an entry from a previous day', async () => {
    const area = createMemoryArea();
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    await recordActivity(area, entry({ timestamp: yesterday }), yesterday);

    const { container } = render(<TodayStats area={area} />);
    await waitFor(() => expect(container.textContent).toBe(''));
  });
});
