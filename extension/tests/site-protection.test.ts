import { describe, expect, it } from 'vitest';
import {
  isOriginProtected,
  isSingleHostOriginPattern,
  listProtectedOrigins,
  originPatternFromUrl,
  requestSiteProtection,
  revokeSiteProtection,
} from '../core/provenance/site-protection';
import { createMemoryPermissions } from './memory-permissions';

describe('originPatternFromUrl', () => {
  it('builds a single-host pattern from an http(s) URL', () => {
    expect(originPatternFromUrl('https://Bank.Example.com/accounts?x=1')).toBe(
      'https://bank.example.com/*',
    );
    expect(originPatternFromUrl('http://localhost:5173/bank')).toBe('http://localhost/*');
  });

  it('rejects non-http(s) and invalid URLs', () => {
    expect(originPatternFromUrl('chrome://extensions')).toBeUndefined();
    expect(originPatternFromUrl('file:///tmp/a.html')).toBeUndefined();
    expect(originPatternFromUrl('not a url')).toBeUndefined();
  });
});

describe('isSingleHostOriginPattern', () => {
  it('accepts exactly one host, rejects wildcards', () => {
    expect(isSingleHostOriginPattern('https://bank.example.com/*')).toBe(true);
    expect(isSingleHostOriginPattern('https://*/*')).toBe(false);
    expect(isSingleHostOriginPattern('https://*.example.com/*')).toBe(false);
    expect(isSingleHostOriginPattern('<all_urls>')).toBe(false);
  });
});

describe('site protection grant/revoke', () => {
  it('requests, reports, and revokes protection for one origin', async () => {
    const permissions = createMemoryPermissions();
    const origin = 'https://bank.demo.test/*';

    expect(await isOriginProtected(permissions, origin)).toBe(false);
    expect(await requestSiteProtection(permissions, origin)).toBe(true);
    expect(await isOriginProtected(permissions, origin)).toBe(true);
    expect(await listProtectedOrigins(permissions)).toEqual([origin]);

    await revokeSiteProtection(permissions, origin);
    expect(await isOriginProtected(permissions, origin)).toBe(false);
    expect(await listProtectedOrigins(permissions)).toEqual([]);
  });

  it('reports a declined request without granting protection', async () => {
    const permissions = createMemoryPermissions();
    permissions.setDenyNextRequest(true);
    const origin = 'https://bank.demo.test/*';

    expect(await requestSiteProtection(permissions, origin)).toBe(false);
    expect(await isOriginProtected(permissions, origin)).toBe(false);
  });

  it('keeps unrelated origins separate', async () => {
    const permissions = createMemoryPermissions(['https://a.test/*']);
    expect(await isOriginProtected(permissions, 'https://b.test/*')).toBe(false);
    await requestSiteProtection(permissions, 'https://b.test/*');
    expect(await listProtectedOrigins(permissions).then((o) => o.sort())).toEqual([
      'https://a.test/*',
      'https://b.test/*',
    ]);
  });
});
