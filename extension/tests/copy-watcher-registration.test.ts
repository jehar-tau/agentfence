import { describe, expect, it } from 'vitest';
import {
  COPY_WATCHER_SCRIPT_FILE,
  reconcileCopyWatchers,
  registerCopyWatcher,
  unregisterCopyWatcher,
} from '../core/provenance/copy-watcher-registration';
import { createMemoryPermissions } from './memory-permissions';
import { createMemoryScripting } from './memory-scripting';

describe('copy watcher registration', () => {
  it('registers a content script matching the given origin', async () => {
    const scripting = createMemoryScripting();
    await registerCopyWatcher(scripting, 'https://bank.demo.test/*');

    const registration = Array.from(scripting.registered.values())[0];
    expect(registration).toEqual({
      matches: ['https://bank.demo.test/*'],
      js: [COPY_WATCHER_SCRIPT_FILE],
    });
  });

  it('re-registering the same origin replaces, not duplicates', async () => {
    const scripting = createMemoryScripting();
    await registerCopyWatcher(scripting, 'https://bank.demo.test/*');
    await registerCopyWatcher(scripting, 'https://bank.demo.test/*');
    expect(scripting.registered.size).toBe(1);
  });

  it('unregisters without error when nothing was registered', async () => {
    const scripting = createMemoryScripting();
    await expect(
      unregisterCopyWatcher(scripting, 'https://bank.demo.test/*'),
    ).resolves.toBeUndefined();
  });

  it('reconciles registrations to exactly the currently granted origins', async () => {
    const permissions = createMemoryPermissions(['https://a.test/*', 'https://b.test/*']);
    const scripting = createMemoryScripting();

    await reconcileCopyWatchers(permissions, scripting);

    expect(Array.from(scripting.registered.keys()).sort()).toEqual([
      'agentfence-copy-watcher:https://a.test/*',
      'agentfence-copy-watcher:https://b.test/*',
    ]);
  });
});
