import { loadState, saveState, type KeyValueArea } from '../storage/state-store';
import { createContextRef } from './context-ref';
import { normalizeHostname, resolveContext } from './match';
import type { ContextRef, DomainContext } from './types';

/** The context a hostname currently resolves to, `unknown` if nothing is assigned. */
export async function getSiteContext(area: KeyValueArea, hostname: string): Promise<ContextRef> {
  const state = await loadState(area);
  return resolveContext(hostname, state.domainContexts);
}

/** Creates or updates the user's exact-hostname assignment for a site. */
export async function assignSiteContext(
  area: KeyValueArea,
  hostname: string,
  context: ContextRef,
  now: number = Date.now(),
): Promise<DomainContext> {
  const pattern = normalizeHostname(hostname);
  if (!pattern) throw new Error('A site hostname is required.');
  if (context.type === 'unknown') throw new Error('Choose a context to assign.');
  const validContext = createContextRef(context.type, context.scope);

  const state = await loadState(area);
  const existing = state.domainContexts.find((entry) => entry.pattern === pattern);
  const entry: DomainContext = existing
    ? { ...existing, context: validContext, enabled: true, source: 'user', updatedAt: now }
    : {
        id: crypto.randomUUID(),
        pattern,
        context: validContext,
        enabled: true,
        source: 'user',
        createdAt: now,
        updatedAt: now,
      };
  await saveState(area, {
    ...state,
    domainContexts: [...state.domainContexts.filter((other) => other.pattern !== pattern), entry],
  });
  return entry;
}

/** Removes the exact-hostname assignment for a site. Wildcard entries are left alone. */
export async function removeSiteContext(area: KeyValueArea, hostname: string): Promise<void> {
  const pattern = normalizeHostname(hostname);
  const state = await loadState(area);
  await saveState(area, {
    ...state,
    domainContexts: state.domainContexts.filter((entry) => entry.pattern !== pattern),
  });
}
