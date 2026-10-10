// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { recordActivity } from '../core/activity/store';
import type { ActivityEntry } from '../core/activity/types';
import { ActivitySection } from '../entrypoints/options/ActivitySection';
import { createMemoryArea } from './memory-area';

afterEach(cleanup);

function entry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    sourceContext: { type: 'finance' },
    destinationContext: { type: 'work' },
    sourceDomain: 'bank.demo.test',
    destinationDomain: 'work-chat.demo.test',
    decision: 'block',
    outcome: 'blocked',
    ...overrides,
  };
}

describe('ActivitySection', () => {
  it('shows an empty state with no history', async () => {
    render(<ActivitySection area={createMemoryArea()} />);
    await waitFor(() => expect(screen.getByText('No activity yet.')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Clear history' })).toHaveProperty('disabled', true);
  });

  it('lists recorded entries with flow, domains, and outcome', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry());

    render(<ActivitySection area={area} />);
    const row = await screen.findByTestId('activity-row');
    expect(row.textContent).toContain('Finance → Work');
    expect(row.textContent).toContain('bank.demo.test → work-chat.demo.test');
    expect(row.textContent).toContain('Blocked');
  });

  it('shows "unknown source" honestly when the source domain is not known', async () => {
    const area = createMemoryArea();
    await recordActivity(
      area,
      entry({ sourceDomain: undefined, sourceContext: { type: 'unknown' } }),
    );

    render(<ActivitySection area={area} />);
    const row = await screen.findByTestId('activity-row');
    expect(row.textContent).toContain('unknown source');
  });

  it('clears all history', async () => {
    const area = createMemoryArea();
    await recordActivity(area, entry());

    render(<ActivitySection area={area} />);
    await screen.findByTestId('activity-row');

    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    await waitFor(() => expect(screen.getByText('No activity yet.')).toBeTruthy());
  });
});
