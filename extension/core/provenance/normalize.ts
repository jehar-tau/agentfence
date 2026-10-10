/**
 * Normalizes text before hashing, so that incidental differences (line endings, a
 * trailing space picked up by a selection, a run of spaces a site renders as one) do not
 * stop a paste from matching the copy it actually came from. Deliberately conservative:
 * it does not touch newlines or casing.
 */
export function normalizeForHash(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .trim()
    .replace(/[ \t]{2,}/g, ' ');
}
