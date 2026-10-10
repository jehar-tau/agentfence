// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, type StoredState } from '../core/storage/schema';
import { SiteContextPanel } from '../entrypoints/popup/SiteContextPanel';
import { createMemoryArea } from './memory-area';
import { createMemoryPermissions } from './memory-permissions';

afterEach(cleanup);

function contextText() {
  return screen.getByTestId('site-context').textContent;
}

function protectionStatus() {
  return screen.getByTestId('protection-status').textContent;
}

function renderPanel(
  options: {
    hostname?: string;
    url?: string;
    area?: ReturnType<typeof createMemoryArea>;
    permissions?: ReturnType<typeof createMemoryPermissions>;
  } = {},
) {
  const hostname = options.hostname ?? 'bank.demo.test';
  const area = options.area ?? createMemoryArea();
  const permissions = options.permissions ?? createMemoryPermissions();
  const url = options.url ?? `https://${hostname}/`;
  const result = render(
    <SiteContextPanel hostname={hostname} url={url} area={area} permissions={permissions} />,
  );
  return { ...result, area, permissions, hostname };
}

describe('SiteContextPanel', () => {
  it('shows an unassigned site and saves a context for it', async () => {
    const { area } = renderPanel({ hostname: 'bank.demo.test' });

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
    const permissions = createMemoryPermissions();
    const first = renderPanel({ hostname: 'chat.demo.test', area, permissions });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(contextText()).toBe('Work'));
    first.unmount();

    renderPanel({ hostname: 'chat.demo.test', area, permissions });
    await waitFor(() => expect(contextText()).toBe('Work'));
  });

  it('requires a client name, then saves a scoped client context', async () => {
    const { area } = renderPanel({ hostname: 'client-a.demo.test' });
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
    renderPanel({ hostname: 'bank.demo.test' });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(contextText()).toBe('Work'));

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
  });

  it('does not show a protection section until a context is assigned', async () => {
    renderPanel({ hostname: 'bank.demo.test' });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    expect(screen.queryByTestId('protection')).toBeNull();
  });

  it('requests site protection automatically after saving a context', async () => {
    const { permissions } = renderPanel({ hostname: 'bank.demo.test' });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));

    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));

    await waitFor(() => expect(protectionStatus()).toBe('On'));
    expect(permissions.granted.has('https://bank.demo.test/*')).toBe(true);
  });

  it('shows a note and a retry button when the user declines the permission prompt', async () => {
    const permissions = createMemoryPermissions();
    permissions.setDenyNextRequest(true);
    renderPanel({ hostname: 'bank.demo.test', permissions });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));

    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));

    await waitFor(() => expect(protectionStatus()).toBe('Off'));
    expect(screen.getByRole('alert').textContent).toContain('not granted');
    expect(permissions.granted.has('https://bank.demo.test/*')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Turn on copy protection' }));
    await waitFor(() => expect(protectionStatus()).toBe('On'));
  });

  it('shows the explanation before protection is granted', async () => {
    renderPanel({ hostname: 'bank.demo.test', permissions: createMemoryPermissions() });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));

    await waitFor(() => expect(protectionStatus()).toBe('On'));
    expect(screen.queryByText(/stays on your device/)).toBeNull();
  });

  it('revokes protection when the context is removed', async () => {
    const { permissions } = renderPanel({ hostname: 'bank.demo.test' });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));
    await waitFor(() => expect(protectionStatus()).toBe('On'));

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByTestId('protection')).toBeNull());
    expect(permissions.granted.has('https://bank.demo.test/*')).toBe(false);
  });

  it('shows protection as already on for a site granted outside the popup', async () => {
    const permissions = createMemoryPermissions(['https://bank.demo.test/*']);
    const area = createMemoryArea();
    renderPanel({ hostname: 'bank.demo.test', area, permissions });
    await waitFor(() => expect(contextText()).toContain('Not assigned'));
    fireEvent.click(screen.getByRole('button', { name: 'Save context' }));

    await waitFor(() => expect(protectionStatus()).toBe('On'));
  });
});
