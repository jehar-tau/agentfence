// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachPasteListener, isEditableTarget } from '../core/enforcement/paste-listener';

afterEach(() => {
  document.body.innerHTML = '';
});

function pasteEvent(target: EventTarget, text: string) {
  return {
    target,
    clipboardData: { getData: (format: string) => (format === 'text/plain' ? text : '') },
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent;
}

describe('isEditableTarget', () => {
  it('accepts an enabled input, textarea, and contentEditable element', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(div)).toBe(true);
  });

  it('rejects a disabled or read-only field, a non-editable element, and null', () => {
    const disabled = document.createElement('input');
    disabled.disabled = true;
    const readOnly = document.createElement('textarea');
    readOnly.readOnly = true;
    const span = document.createElement('span');
    expect(isEditableTarget(disabled)).toBe(false);
    expect(isEditableTarget(readOnly)).toBe(false);
    expect(isEditableTarget(span)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe('attachPasteListener', () => {
  function fakeTarget() {
    const listeners = new Map<string, (event: ClipboardEvent) => void>();
    return {
      addEventListener: vi.fn((type: string, handler: (event: ClipboardEvent) => void) =>
        listeners.set(type, handler),
      ),
      removeEventListener: vi.fn((type: string) => listeners.delete(type)),
      fire(event: ClipboardEvent) {
        listeners.get('paste')?.(event);
      },
    };
  }

  it('reports the pasted text and prevents the native paste, for an editable target', () => {
    const target = fakeTarget();
    const onPaste = vi.fn();
    attachPasteListener(target, onPaste);

    const input = document.createElement('input');
    const event = pasteEvent(input, 'secret value');
    target.fire(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onPaste).toHaveBeenCalledWith('secret value');
  });

  it('leaves a paste into a non-editable target completely alone', () => {
    const target = fakeTarget();
    const onPaste = vi.fn();
    attachPasteListener(target, onPaste);

    const span = document.createElement('span');
    const event = pasteEvent(span, 'secret value');
    target.fire(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onPaste).not.toHaveBeenCalled();
  });

  it('ignores a paste with no text (e.g. an image)', () => {
    const target = fakeTarget();
    const onPaste = vi.fn();
    attachPasteListener(target, onPaste);

    const input = document.createElement('input');
    const event = pasteEvent(input, '');
    target.fire(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onPaste).not.toHaveBeenCalled();
  });

  it('removes the listener when the cleanup function is called', () => {
    const target = fakeTarget();
    const detach = attachPasteListener(target, vi.fn());
    detach();
    expect(target.removeEventListener).toHaveBeenCalledWith('paste', expect.any(Function));
  });
});
