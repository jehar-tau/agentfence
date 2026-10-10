import { listProtectedOrigins, type PermissionsArea } from '../provenance/site-protection';

type RunAt = 'document_start' | 'document_end' | 'document_idle';

/** The subset of chrome.scripting AgentFence uses, so tests can substitute a fake. */
export interface ScriptingArea {
  registerContentScripts(
    scripts: Array<{ id: string; matches: string[]; js: string[]; runAt?: RunAt }>,
  ): Promise<void>;
  unregisterContentScripts(filter: { ids: string[] }): Promise<void>;
}

/** Built from the unlisted-script entrypoints of the same names; see extension/entrypoints/. */
export const COPY_WATCHER_SCRIPT_FILE = 'copy-watcher.js';
export const PASTE_WATCHER_SCRIPT_FILE = 'paste-watcher.js';

function scriptId(originPattern: string): string {
  return `agentfence-site-watcher:${originPattern}`;
}

/**
 * Registers (or re-registers) both watcher scripts for one granted origin, as a single
 * registration with two files — they run together in the same isolated world, each setting
 * up its own listener independently. Background-only.
 */
export async function registerSiteWatchers(
  scripting: ScriptingArea,
  originPattern: string,
): Promise<void> {
  await unregisterSiteWatchers(scripting, originPattern);
  await scripting.registerContentScripts([
    {
      id: scriptId(originPattern),
      matches: [originPattern],
      js: [COPY_WATCHER_SCRIPT_FILE, PASTE_WATCHER_SCRIPT_FILE],
      runAt: 'document_idle',
    },
  ]);
}

export async function unregisterSiteWatchers(
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
 * Re-registers the watcher scripts for every currently granted site. Called on startup so
 * registrations are correct even if Chrome did not carry them over, and so a permission
 * revoked outside AgentFence (e.g. from chrome://extensions) is picked up.
 */
export async function reconcileSiteWatchers(
  permissions: PermissionsArea,
  scripting: ScriptingArea,
): Promise<void> {
  const origins = await listProtectedOrigins(permissions);
  await Promise.all(origins.map((origin) => registerSiteWatchers(scripting, origin)));
}
