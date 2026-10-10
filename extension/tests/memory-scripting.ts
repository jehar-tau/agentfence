import type { ScriptingArea } from '../core/provenance/copy-watcher-registration';

/** In-memory stand-in for chrome.scripting, for tests. */
export function createMemoryScripting(): ScriptingArea & {
  registered: Map<string, { matches: string[]; js: string[] }>;
} {
  const registered = new Map<string, { matches: string[]; js: string[] }>();
  return {
    registered,
    async registerContentScripts(scripts) {
      for (const script of scripts) {
        registered.set(script.id, { matches: script.matches, js: script.js });
      }
    },
    async unregisterContentScripts({ ids }) {
      for (const id of ids) registered.delete(id);
    },
  };
}
