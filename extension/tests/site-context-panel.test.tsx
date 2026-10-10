// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, type StoredState } from '../core/storage/schema';
import { SiteContextPanel } from '../entrypoints/popup/SiteContextPanel';
import { createMemoryArea } from './memory-area';

afterEach(cleanup);

function contextText() {
  return screen.getByTestId('site-context').textContent;
}

describe('SiteContextPanel', () => {
  it('shows an unassigned site and saves a context for it', async () => {
    const area = createMemoryArea();
    render(<SiteContextPanel hostname="bank.demo.test" area={area} />);

    expect(screen.getByTestId('site-hostname').textContent).toBe('bank.demo.test');
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Set context'), { target: { value: 'finance' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));

    await waitFor(() => expect(contextText()).toBe('Finance'));
    expect((area.data[STORAGE_KEY] as StoredState).domainContexts).toMatchObject([
      { pattern: 'bank.demo.test', context: { type: 'finance' }, source: 'user' },
    ]);
  });

  it('loads a previously saved context when reopened', async () => {
    const area = createMemoryArea();
    const first = render(<SiteContextPanel hostname="chat.demo.test" area={area} />);
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(contextText()).toBe('Work'));
    first.unmount();

    render(<SiteContextPanel hostname="chat.demo.test" area={area} />);
    await waitFor(() => expect(contextText()).toBe('Work'));
  });

  it('requires a client name, then saves a scoped client context', async () => {
    const area = createMemoryArea();
    render(<SiteContextPanel hostname="client-a.demo.test" area={area} />);
    await waitFor(() => expect(contextText()).toContain('Not assigned'));

    expect(screen.queryByLabelText('Client name')).toBeNull();
    fireEvent.change(screen.getByLabelText('Set context'), { target: { value: 'client' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('client name'));
    expect(area.data[STORAGE_KEY]).toMatchObject({ domainContexts: [] });

    fireEvent.change(screen.getByLabelText('Client name'), { target: { value: 'ACME' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(contextText()).toBe('Client · acme'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('removes an assignment', async () => {
    const area = createMemoryArea();
    render(<SiteContextPanel hostname="bank.demo.test" area={area} />);
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(contextText()).toBe('Work'));

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    expect((area.data[STORAGE_KEY] as StoredState).domainContexts).toEqual([]);
  });
});
