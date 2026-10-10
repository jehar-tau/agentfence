/**
 * Watches for `copy` events and reports the selected text. Kept separate from the
 * unlisted script that wires it to `window` so the event-handling logic can be unit
 * tested without a real DOM Selection API.
 */
export function attachCopyListener(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  getSelectionText: () => string,
  onCopy: (text: string) => void,
): () => void {
  function handleCopy() {
    const text = getSelectionText();
    if (text) onCopy(text);
  }
  target.addEventListener('copy', handleCopy);
  return () => target.removeEventListener('copy', handleCopy);
}
