import { describe, expect, it } from 'vitest';
import {
  ALWAYS_ALLOW_MESSAGE_TYPE,
  PASTE_CHECK_MESSAGE_TYPE,
  isAlwaysAllowMessage,
  isPasteCheckMessage,
  isRecordActivityMessage,
} from '../core/enforcement/messages';

describe('isPasteCheckMessage', () => {
  it('accepts a well-formed paste-check message', () => {
    expect(
      isPasteCheckMessage({ type: PASTE_CHECK_MESSAGE_TYPE, text: 'hi', href: 'https://a.test' }),
    ).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isPasteCheckMessage(undefined)).toBe(false);
    expect(
      isPasteCheckMessage({ type: 'agentfence:copy', text: 'hi', href: 'https://a.test' }),
    ).toBe(false);
    expect(isPasteCheckMessage({ type: PASTE_CHECK_MESSAGE_TYPE, text: 1, href: 'x' })).toBe(false);
    expect(isPasteCheckMessage({ type: PASTE_CHECK_MESSAGE_TYPE, text: 'hi' })).toBe(false);
  });
});

describe('isAlwaysAllowMessage', () => {
  it('accepts a well-formed always-allow message', () => {
    expect(
      isAlwaysAllowMessage({
        type: ALWAYS_ALLOW_MESSAGE_TYPE,
        source: { type: 'finance' },
        destination: { type: 'work' },
      }),
    ).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isAlwaysAllowMessage(undefined)).toBe(false);
    expect(
      isAlwaysAllowMessage({ type: ALWAYS_ALLOW_MESSAGE_TYPE, source: { type: 'finance' } }),
    ).toBe(false);
    expect(
      isAlwaysAllowMessage({
        type: ALWAYS_ALLOW_MESSAGE_TYPE,
        source: 'finance',
        destination: 'work',
      }),
    ).toBe(false);
  });
});

describe('isRecordActivityMessage', () => {
  it('accepts a well-formed record-activity message', () => {
    expect(
      isRecordActivityMessage({
        type: 'agentfence:record-activity',
        sourceContext: { type: 'finance' },
        destinationContext: { type: 'work' },
        destinationDomain: 'work-chat.test',
        decision: 'ask',
        outcome: 'blocked',
      }),
    ).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isRecordActivityMessage(undefined)).toBe(false);
    expect(
      isRecordActivityMessage({
        type: 'agentfence:record-activity',
        sourceContext: { type: 'finance' },
        destinationContext: { type: 'work' },
        decision: 'ask',
        outcome: 'blocked',
        // missing destinationDomain
      }),
    ).toBe(false);
  });
});
