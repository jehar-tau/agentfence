// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ASSIGNABLE_CONTEXT_TYPES, CONTEXT_LABELS } from '../core/context/types';
import { defaultFlowRules } from '../core/policy/defaults';
import { describeRule } from '../core/policy/describe';
import { setRuleDecision } from '../core/policy/repository';
import { App } from '../entrypoints/onboarding/App';
import { createMemoryArea } from './memory-area';

afterEach(cleanup);

describe('onboarding', () => {
  it('covers context boundaries, the six contexts, protecting a site, and trying the demo', () => {
    render(<App area={createMemoryArea()} />);
    expect(screen.getByText('1. Context boundaries')).toBeTruthy();
    expect(screen.getByText('2. Six contexts')).toBeTruthy();
    expect(screen.getByText('3. Protect a site')).toBeTruthy();
    expect(screen.getByText('4. Default rules')).toBeTruthy();
    expect(screen.getByText('5. Try it')).toBeTruthy();
  });

  it('lists all six assignable context types', () => {
    render(<App area={createMemoryArea()} />);
    for (const type of ASSIGNABLE_CONTEXT_TYPES) {
      expect(screen.getByText(CONTEXT_LABELS[type])).toBeTruthy();
    }
  });

  it('shows the permission explanation verbatim, matching the popup', () => {
    render(<App area={createMemoryArea()} />);
    expect(
      screen.getByText(
        'AgentFence needs access to this site to detect supported information transfers on it. Page content stays on your device.',
      ),
    ).toBeTruthy();
  });

  it('shows the current default rules, loaded live rather than hardcoded', async () => {
    const { container } = render(<App area={createMemoryArea()} />);
    const rulesTable = container.querySelector<HTMLElement>('.rules-table')!;
    for (const rule of defaultFlowRules()) {
      await waitFor(() => expect(within(rulesTable).getByText(describeRule(rule))).toBeTruthy());
    }
  });

  it('reflects a rule the user already changed, not a stale copy', async () => {
    const area = createMemoryArea();
    await setRuleDecision(area, 'default-finance-to-work', 'allow');

    const { container } = render(<App area={area} />);
    const rulesTable = container.querySelector<HTMLElement>('.rules-table')!;
    const row = (await within(rulesTable).findByText('Finance → Work')).closest('tr')!;
    await waitFor(() => expect(row.textContent).toContain('Allow'));
  });

  it('links to the demo playground', () => {
    render(<App area={createMemoryArea()} />);
    const link = screen.getByRole('link', { name: 'Open the demo playground' });
    expect(link.getAttribute('href')).toBe('http://localhost:5300/');
  });

  it('has a closing action to dismiss onboarding', () => {
    render(<App area={createMemoryArea()} />);
    expect(screen.getByRole('button', { name: 'Got it — start browsing' })).toBeTruthy();
  });
});
