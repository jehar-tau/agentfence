import { describe, expect, it } from 'vitest';
import {
  ContextRefError,
  contextRefEquals,
  createContextRef,
  describeContextRef,
  formatContextRef,
  normalizeScope,
  parseContextRef,
} from '../core/context/context-ref';
import { ASSIGNABLE_CONTEXT_TYPES, CONTEXT_TYPES } from '../core/context/types';

describe('context types', () => {
  it('defines the seven context types', () => {
    expect([...CONTEXT_TYPES]).toEqual([
      'work',
      'personal',
      'finance',
      'health',
      'client',
      'public',
      'unknown',
    ]);
  });

  it('does not let users assign unknown', () => {
    expect(ASSIGNABLE_CONTEXT_TYPES).not.toContain('unknown');
    expect(ASSIGNABLE_CONTEXT_TYPES).toHaveLength(6);
  });
});

describe('normalizeScope', () => {
  it.each([
    ['acme', 'acme'],
    ['  ACME  ', 'acme'],
    ['Acme Demo Corp', 'acme-demo-corp'],
    ['acme/../globex', 'acmeglobex'],
    ['--acme--', 'acme'],
    ['   ', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalizeScope(input)).toBe(expected);
  });
});

describe('createContextRef', () => {
  it('requires a scope for client contexts', () => {
    expect(() => createContextRef('client')).toThrow(ContextRefError);
    expect(() => createContextRef('client', '  ')).toThrow(ContextRefError);
  });

  it('normalizes the client scope', () => {
    expect(createContextRef('client', ' ACME ')).toEqual({ type: 'client', scope: 'acme' });
  });

  it('drops scope for non-client contexts', () => {
    expect(createContextRef('work', 'acme')).toEqual({ type: 'work' });
  });
});

describe('formatContextRef / parseContextRef', () => {
  it('round-trips scoped clients', () => {
    expect(formatContextRef({ type: 'client', scope: 'acme' })).toBe('client/acme');
    expect(parseContextRef('client/acme')).toEqual({ type: 'client', scope: 'acme' });
    expect(parseContextRef('client/globex')).toEqual({ type: 'client', scope: 'globex' });
  });

  it('round-trips plain contexts', () => {
    for (const type of CONTEXT_TYPES.filter((t) => t !== 'client')) {
      expect(parseContextRef(formatContextRef({ type }))).toEqual({ type });
    }
  });

  it('rejects invalid refs', () => {
    expect(parseContextRef('client')).toBeUndefined();
    expect(parseContextRef('work/acme')).toBeUndefined();
    expect(parseContextRef('client/acme/extra')).toBeUndefined();
    expect(parseContextRef('banking')).toBeUndefined();
    expect(parseContextRef('')).toBeUndefined();
  });
});

describe('contextRefEquals', () => {
  it('treats different client scopes as different contexts', () => {
    expect(
      contextRefEquals({ type: 'client', scope: 'acme' }, { type: 'client', scope: 'globex' }),
    ).toBe(false);
    expect(
      contextRefEquals({ type: 'client', scope: 'acme' }, { type: 'client', scope: 'acme' }),
    ).toBe(true);
  });

  it('compares plain contexts by type', () => {
    expect(contextRefEquals({ type: 'work' }, { type: 'work' })).toBe(true);
    expect(contextRefEquals({ type: 'work' }, { type: 'personal' })).toBe(false);
  });
});

describe('describeContextRef', () => {
  it('labels contexts for display', () => {
    expect(describeContextRef({ type: 'finance' })).toBe('Finance');
    expect(describeContextRef({ type: 'client', scope: 'acme' })).toBe('Client · acme');
  });
});
