export interface PasteTarget {
  addEventListener(type: 'paste', handler: (event: ClipboardEvent) => void): void;
  removeEventListener(type: 'paste', handler: (event: ClipboardEvent) => void): void;
}

/**
 * A field the user can actually type or paste into, and that isn't locked. Checks the
 * `contenteditable` attribute as well as `isContentEditable` itself, since some test/DOM
 * environments do not compute the latter.
 */
export function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return false;
  const field = target as HTMLInputElement | HTMLTextAreaElement;
  return !field.disabled && !field.readOnly;
}

/**
 * Watches for a `paste` event into an editable element and hands its plain-text clipboard
 * contents to `onPaste`, having already prevented the native paste — the decision needs an
 * async lookup, so the caller decides whether and how to complete it (see insert-text.ts).
 * A paste with no text (e.g. an image) or into a non-editable target is left alone.
 */
export function attachPasteListener(
  target: PasteTarget,
  onPaste: (text: string) => void,
): () => void {
  function handlePaste(event: ClipboardEvent) {
    if (!isEditableTarget(event.target)) return;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!text) return;
    event.preventDefault();
    onPaste(text);
  }
  target.addEventListener('paste', handlePaste);
  return () => target.removeEventListener('paste', handlePaste);
}
