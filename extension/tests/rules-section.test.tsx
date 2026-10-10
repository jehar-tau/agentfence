// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultFlowRules } from '../core/policy/defaults';
import { listRules } from '../core/policy/repository';
import { RulesSection } from '../entrypoints/options/RulesSection';
import { createMemoryArea } from './memory-area';

afterEach(cleanup);

async function renderRules(area = createMemoryArea()) {
  render(<RulesSection area={area} />);
  await waitFor(() => expect(screen.getAllByTestId('rule-row').length).toBeGreaterThan(0));
  return area;
}

function select(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('RulesSection', () => {
  it('lists the default rules', async () => {
    await renderRules();
    expect(screen.getAllByTestId('rule-row')).toHaveLength(defaultFlowRules().length);
    expect(screen.getByRole('rowheader', { name: /^Finance → Public/ })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: /^Same context → Same context/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Delete/ })).toBeNull();
  });

  it('changes a rule decision and persists it', async () => {
    const area = await renderRules();
    select('Decision for Finance → Work', 'block');
    await waitFor(async () =>
      expect(
        (await listRules(area)).find((r) => r.id === 'default-finance-to-work')?.decision,
      ).toBe('block'),
    );
  });

  it('turns a rule off', async () => {
    const area = await renderRules();
    fireEvent.click(screen.getByLabelText('Enable Finance → Public'));
    await waitFor(async () =>
      expect(
        (await listRules(area)).find((r) => r.id === 'default-finance-to-public')?.enabled,
      ).toBe(false),
    );
  });

  it('adds a scoped client rule, then deletes it', async () => {
    const area = await renderRules();
    select('Source', 'client');
    fireEvent.change(screen.getByLabelText(/^Source client name/), { target: { value: 'ACME' } });
    select('Destination', 'client');
    fireEvent.change(screen.getByLabelText(/^Destination client name/), {
      target: { value: 'Globex' },
    });
    select('Decision', 'allow');
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    const row = (
      await screen.findByRole('rowheader', { name: /^Client · acme → Client · globex/ })
    ).closest('tr')!;
    expect(within(row).getByText('Yours')).toBeTruthy();
    expect(await listRules(area)).toHaveLength(defaultFlowRules().length + 1);

    fireEvent.click(within(row).getByRole('button', { name: /^Delete/ }));
    await waitFor(() =>
      expect(screen.getAllByTestId('rule-row')).toHaveLength(defaultFlowRules().length),
    );
    expect(await listRules(area)).toEqual(defaultFlowRules());
  });

  it('resets rules to defaults', async () => {
    const area = await renderRules();
    select('Decision for Finance → Public', 'allow');
    await waitFor(async () => expect(await listRules(area)).not.toEqual(defaultFlowRules()));

    fireEvent.click(screen.getByRole('button', { name: 'Reset rules to defaults' }));
    await waitFor(async () => expect(await listRules(area)).toEqual(defaultFlowRules()));
  });

  it('checks a flow against the current rules', async () => {
    await renderRules();
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByTestId('check-result').textContent).toBe(
      'Ask. Finance → Work: matched the exact context rule “Finance → Work”: Ask.',
    );

    select('From', 'client');
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert').textContent).toContain('client name');
    expect(screen.queryByTestId('check-result')).toBeNull();

    fireEvent.change(screen.getByLabelText('From client name'), { target: { value: 'acme' } });
    select('To', 'client');
    fireEvent.change(screen.getByLabelText('To client name'), { target: { value: 'globex' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByTestId('check-result').textContent).toContain('Block.');
  });
});
