import { describe, expect, it } from 'vitest';
import {
  hostnameFromUrl,
  matchesPattern,
  resolveContext,
  resolveDomainContext,
} from '../core/context/match';
import type { ContextRef, DomainContext } from '../core/context/types';

function entry(pattern: string, context: ContextRef, enabled = true): DomainContext {
  return { id: pattern, pattern, context, enabled, source: 'user', createdAt: 0, updatedAt: 0 };
}

describe('hostnameFromUrl', () => {
  it('extracts a normalized hostname from http(s) URLs', () => {
    expect(hostnameFromUrl('https://Bank.Example.com/accounts?x=1')).toBe('bank.example.com');
    expect(hostnameFromUrl('http://localhost:5173/bank')).toBe('localhost');
  });

  it('returns undefined for pages that cannot be classified', () => {
    expect(hostnameFromUrl('chrome://extensions')).toBeUndefined();
    expect(hostnameFromUrl('chrome-extension://abc/popup.html')).toBeUndefined();
    expect(hostnameFromUrl('file:///tmp/a.html')).toBeUndefined();
    expect(hostnameFromUrl('not a url')).toBeUndefined();
    expect(hostnameFromUrl(undefined)).toBeUndefined();
  });
});

describe('matchesPattern', () => {
  it('matches exact hostnames case-insensitively', () => {
    expect(matchesPattern('slack.com', 'slack.com')).toBe(true);
    expect(matchesPattern('Slack.com', 'SLACK.COM.')).toBe(true);
  });

  it('does not treat an exact hostname as covering subdomains or lookalikes', () => {
    expect(matchesPattern('slack.com', 'app.slack.com')).toBe(false);
    expect(matchesPattern('slack.com', 'notslack.com')).toBe(false);
    expect(matchesPattern('slack.com', 'slack.com.evil.test')).toBe(false);
  });

  it('matches subdomain wildcards', () => {
    expect(matchesPattern('*.slack.com', 'app.slack.com')).toBe(true);
    expect(matchesPattern('*.slack.com', 'a.b.slack.com')).toBe(true);
    expect(matchesPattern('*.slack.com', 'slack.com')).toBe(false);
    expect(matchesPattern('*.slack.com', 'evilslack.com')).toBe(false);
  });

  it('rejects empty and bare-wildcard patterns', () => {
    expect(matchesPattern('', 'slack.com')).toBe(false);
    expect(matchesPattern('*.', 'slack.com')).toBe(false);
  });
});

describe('resolveContext', () => {
  const entries = [
    entry('*.example.com', { type: 'work' }),
    entry('*.clients.example.com', { type: 'client', scope: 'acme' }),
    entry('bank.example.com', { type: 'finance' }),
  ];

  it('prefers an exact match over a wildcard', () => {
    expect(resolveContext('bank.example.com', entries)).toEqual({ type: 'finance' });
  });

  it('prefers the longest wildcard', () => {
    expect(resolveContext('a.clients.example.com', entries)).toEqual({
      type: 'client',
      scope: 'acme',
    });
    expect(resolveContext('chat.example.com', entries)).toEqual({ type: 'work' });
  });

  it('returns unknown when nothing matches', () => {
    expect(resolveContext('other.test', entries)).toEqual({ type: 'unknown' });
    expect(resolveDomainContext('other.test', entries)).toBeUndefined();
  });

  it('ignores disabled entries', () => {
    const disabled = [entry('bank.example.com', { type: 'finance' }, false)];
    expect(resolveContext('bank.example.com', disabled)).toEqual({ type: 'unknown' });
  });
});
