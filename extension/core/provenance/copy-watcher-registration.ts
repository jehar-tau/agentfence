import { listProtectedOrigins, type PermissionsArea } from './site-protection';

type RunAt = 'document_start' | 'document_end' | 'document_idle';

/** The subset of chrome.scripting AgentFence uses, so tests can substitute a fake. */
export interface ScriptingArea {
  registerContentScripts(
    scripts: Array<{ id: string; matches: string[]; js: string[]; runAt?: RunAt }>,
  ): Promise<void>;
  unregisterContentScripts(filter: { ids: string[] }): Promise<void>;
}

/** Built from the `copy-watcher` entrypoint; see extension/entrypoints/copy-watcher.ts. */
export const COPY_WATCHER_SCRIPT_FILE = 'copy-watcher.js';

function scriptId(originPattern: string): string {
  return `agentfence-copy-watcher:${originPattern}`;
}

/** Registers (or re-registers) the copy watcher for one granted origin. Background-only. */
export async function registerCopyWatcher(
  scripting: ScriptingArea,
  originPattern: string,
): Promise<void> {
  await unregisterCopyWatcher(scripting, originPattern);
  await scripting.registerContentScripts([
    {
      id: scriptId(originPattern),
      matches: [originPattern],
      js: [COPY_WATCHER_SCRIPT_FILE],
      runAt: 'document_idle',
    },
  ]);
}

export async function unregisterCopyWatcher(
  scripting: ScriptingArea,
  originPattern: string,
): Promise<void> {
  try {
    await scripting.unregisterContentScripts({ ids: [scriptId(originPattern)] });
  } catch {
    // Nothing was registered for this origin yet.
  }
}

/**
 * Re-registers the copy watcher for every currently granted site. Called on startup so
 * registrations are correct even if Chrome did not carry them over, and so a permission
 * revoked outside AgentFence (e.g. from chrome://extensions) is picked up.
 */
export async function reconcileCopyWatchers(
  permissions: PermissionsArea,
  scripting: ScriptingArea,
): Promise<void> {
  const origins = await listProtectedOrigins(permissions);
  await Promise.all(origins.map((origin) => registerCopyWatcher(scripting, origin)));
}
