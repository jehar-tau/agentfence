/**
 * Re-inserts text into whatever element is currently focused, as if it had just been pasted.
 * Returns false if the browser could not do this, so the caller can warn honestly instead of
 * claiming the paste completed (AGENTS.md #14).
 *
 * Known limitation: this always inserts plain text, even if the original clipboard held
 * rich/HTML content — `execCommand('insertText', ...)` is the only mechanism that reliably
 * completes a paste across both plain fields and contentEditable elements after it has already
 * been prevented. See docs/decisions.md.
 */
export function insertPastedText(doc: Document, text: string): boolean {
  try {
    return doc.execCommand('insertText', false, text);
  } catch {
    return false;
  }
}
