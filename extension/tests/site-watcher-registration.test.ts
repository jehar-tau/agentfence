import { describe, expect, it } from 'vitest';
import {
  COPY_WATCHER_SCRIPT_FILE,
  PASTE_WATCHER_SCRIPT_FILE,
  reconcileSiteWatchers,
  registerSiteWatchers,
  unregisterSiteWatchers,
} from '../core/enforcement/site-watcher-registration';
import { createMemoryPermissions } from './memory-permissions';
import { createMemoryScripting } from './memory-scripting';

describe('site watcher registration', () => {
  it('registers both watcher scripts matching the given origin', async () => {
    const scripting = createMemoryScripting();
    await registerSiteWatchers(scripting, 'https://bank.demo.test/*');

    const registration = Array.from(scripting.registered.values())[0];
    expect(registration).toEqual({
      matches: ['https://bank.demo.test/*'],
      js: [COPY_WATCHER_SCRIPT_FILE, PASTE_WATCHER_SCRIPT_FILE],
    });
  });

  it('re-registering the same origin replaces, not duplicates', async () => {
    const scripting = createMemoryScripting();
    await registerSiteWatchers(scripting, 'https://bank.demo.test/*');
    await registerSiteWatchers(scripting, 'https://bank.demo.test/*');
    expect(scripting.registered.size).toBe(1);
  });

  it('unregisters without error when nothing was registered', async () => {
    const scripting = createMemoryScripting();
    await expect(
      unregisterSiteWatchers(scripting, 'https://bank.demo.test/*'),
    ).resolves.toBeUndefined();
  });

  it('reconciles registrations to exactly the currently granted origins', async () => {
    const permissions = createMemoryPermissions(['https://a.test/*', 'https://b.test/*']);
    const scripting = createMemoryScripting();

    await reconcileSiteWatchers(permissions, scripting);

    expect(Array.from(scripting.registered.keys()).sort()).toEqual([
      'agentfence-site-watcher:https://a.test/*',
      'agentfence-site-watcher:https://b.test/*',
    ]);
  });
});
