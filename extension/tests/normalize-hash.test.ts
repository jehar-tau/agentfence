import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../core/provenance/hash';
import { normalizeForHash } from '../core/provenance/normalize';

describe('normalizeForHash', () => {
  it('trims, unifies line endings, and collapses runs of spaces/tabs', () => {
    expect(normalizeForHash('  hello   world  ')).toBe('hello world');
    expect(normalizeForHash('line1\r\nline2\rline3\nline4')).toBe('line1\nline2\nline3\nline4');
    expect(normalizeForHash('a\t\tb')).toBe('a b');
  });

  it('does not collapse a single internal space or touch newlines', () => {
    expect(normalizeForHash('hello world')).toBe('hello world');
    expect(normalizeForHash('line1\n\nline2')).toBe('line1\n\nline2');
  });

  it('normalizes unicode to a canonical form', () => {
    const decomposed = 'café'; // "café" as e + combining acute accent
    const precomposed = 'café';
    expect(normalizeForHash(decomposed)).toBe(normalizeForHash(precomposed));
  });

  it('reduces an all-whitespace string to empty', () => {
    expect(normalizeForHash('   \t  \n  ')).toBe('');
  });
});

describe('sha256Hex', () => {
  it('matches a known SHA-256 digest', async () => {
    expect(await sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is deterministic and sensitive to every character', async () => {
    expect(await sha256Hex('hello')).toBe(await sha256Hex('hello'));
    expect(await sha256Hex('hello')).not.toBe(await sha256Hex('Hello'));
  });
});
