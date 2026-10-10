import { UNKNOWN_CONTEXT, type ContextRef, type DomainContext } from './types';

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

/** Hostname of an http(s) URL, or undefined for pages AgentFence cannot classify. */
export function hostnameFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return normalizeHostname(parsed.hostname) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * `example.com` matches only that host. `*.example.com` matches any subdomain of
 * example.com but not example.com itself.
 */
export function matchesPattern(pattern: string, hostname: string): boolean {
  const normalizedPattern = normalizeHostname(pattern);
  const host = normalizeHostname(hostname);
  if (!normalizedPattern || !host) return false;
  if (normalizedPattern.startsWith('*.')) {
    const suffix = normalizedPattern.slice(1);
    return suffix.length > 1 && host.length > suffix.length && host.endsWith(suffix);
  }
  return normalizedPattern === host;
}

/** The most specific enabled entry for a hostname: exact match first, then longest wildcard. */
export function resolveDomainContext(
  hostname: string,
  entries: readonly DomainContext[],
): DomainContext | undefined {
  let best: DomainContext | undefined;
  for (const entry of entries) {
    if (!entry.enabled || !matchesPattern(entry.pattern, hostname)) continue;
    const isWildcard = entry.pattern.startsWith('*.');
    if (!isWildcard) return entry;
    if (!best || entry.pattern.length > best.pattern.length) best = entry;
  }
  return best;
}

export function resolveContext(hostname: string, entries: readonly DomainContext[]): ContextRef {
  return resolveDomainContext(hostname, entries)?.context ?? UNKNOWN_CONTEXT;
}
