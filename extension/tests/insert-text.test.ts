// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { insertPastedText } from '../core/enforcement/insert-text';

describe('insertPastedText', () => {
  it('returns a boolean and never throws, regardless of what the environment supports', () => {
    // jsdom does not implement a real editing engine, so this cannot verify the text actually
    // lands in the page; that needs a real browser (see docs/decisions.md, manual verification).
    expect(() => insertPastedText(document, 'hello')).not.toThrow();
    expect(typeof insertPastedText(document, 'hello')).toBe('boolean');
  });
});
