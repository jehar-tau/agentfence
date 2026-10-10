// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { assignSiteContext } from '../core/context/repository';
import { App } from '../entrypoints/visual-map/App';
import { createMemoryArea } from './memory-area';
import { createMemoryPermissions } from './memory-permissions';

afterEach(cleanup);

describe('visual map', () => {
  it('shows an empty-state message when no sites are protected yet', async () => {
    render(<App area={createMemoryArea()} permissions={createMemoryPermissions()} />);
    await waitFor(() => expect(screen.getByText('No protected sites yet.')).toBeTruthy());
  });

  it('shows a node for each assigned site, marking whether it is protected', async () => {
    const area = createMemoryArea();
    const permissions = createMemoryPermissions(['https://bank.demo.test/*']);
    await assignSiteContext(area, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(area, 'work-chat.demo.test', { type: 'work' });

    render(<App area={area} permissions={permissions} />);

    await waitFor(() => expect(screen.getByText('bank.demo.test')).toBeTruthy());
    expect(screen.getByText('work-chat.demo.test')).toBeTruthy();
    expect(screen.getAllByText('not protected')).toHaveLength(1);
  });

  it('selecting a node shows its context and the flows touching it', async () => {
    const area = createMemoryArea();
    await assignSiteContext(area, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(area, 'work-chat.demo.test', { type: 'work' });

    render(<App area={area} permissions={createMemoryPermissions()} />);
    await waitFor(() => screen.getByText('bank.demo.test'));

    fireEvent.click(screen.getByText('bank.demo.test'));
    expect(screen.getByRole('heading', { name: 'bank.demo.test' })).toBeTruthy();
    expect(screen.getByText('Finance')).toBeTruthy();
    expect(screen.getByText(/Finance → Work: Ask/)).toBeTruthy();
  });

  it('selecting a flow shows its decision and matched rule, honestly noting confidence is unavailable', async () => {
    const area = createMemoryArea();
    await assignSiteContext(area, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(area, 'work-chat.demo.test', { type: 'work' });

    render(<App area={area} permissions={createMemoryPermissions()} />);
    await waitFor(() => screen.getAllByRole('button', { name: /Finance to Work, ask/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Finance to Work, ask/ })[0]!);

    expect(screen.getByRole('heading', { name: 'Finance → Work' })).toBeTruthy();
    expect(screen.getByText('Ask')).toBeTruthy();
    expect(screen.getByText(/bank.demo.test → work-chat.demo.test/)).toBeTruthy();
    expect(screen.getByText(/Not available yet/)).toBeTruthy();
  });

  it('filters edges by decision', async () => {
    const area = createMemoryArea();
    await assignSiteContext(area, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(area, 'public-form.demo.test', { type: 'public' });

    render(<App area={area} permissions={createMemoryPermissions()} />);
    await waitFor(() => screen.getByRole('button', { name: /Blocked only.*1/ }));

    expect(screen.getAllByRole('button', { name: /Finance to Public/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Allowed only.*0/ }));
    expect(screen.queryAllByRole('button', { name: /Finance to Public/ })).toHaveLength(0);
  });

  it('filters to flows touching the current site, when one was passed in', async () => {
    const area = createMemoryArea();
    await assignSiteContext(area, 'bank.demo.test', { type: 'finance' });
    await assignSiteContext(area, 'work-chat.demo.test', { type: 'work' });
    await assignSiteContext(area, 'public-form.demo.test', { type: 'public' });

    render(
      <App
        area={area}
        permissions={createMemoryPermissions()}
        currentSiteHostname="bank.demo.test"
      />,
    );
    const currentSiteButton = () =>
      screen.getByRole('button', { name: /Current site \(bank.demo.test\)/ });
    await waitFor(() => currentSiteButton());
    fireEvent.click(currentSiteButton());

    expect(screen.getAllByRole('button', { name: /Finance to Work/ })).toHaveLength(1);
    expect(screen.queryAllByRole('button', { name: /Work to Public/ })).toHaveLength(0);
  });
});
