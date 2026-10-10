# Threat model

AgentFence helps with:

- accidental cross-context copy/paste
- browser-based agent transfer
- wrong-client leakage
- sensitive-to-public transfer
- user error in AI-assisted browser workflows

AgentFence does **not** claim to protect against:

- malicious browser extensions
- a compromised browser
- OS-level malware
- invisible server-to-server activity
- native desktop automation
- screenshots or OCR outside the browser
- direct API calls that bypass the browser UI
- other side channels

If a transfer cannot be reliably observed or blocked, AgentFence says so rather than
implying it was handled. See `docs/permissions.md` for what each permission lets it see.

## What AgentFence can currently observe (as of Milestone 3)

AgentFence can detect a `copy` event on a site you have explicitly granted it access to
("copy protection"), and record: a SHA-256 hash of the copied text, its character length,
the source site's domain, the context you assigned that site, the browser tab id, and a
timestamp. The hash and length are enough to recognize the same text again later; the
text itself is never stored, logged, or sent anywhere. This metadata is kept in
`chrome.storage.session` (cleared when the browser closes) and expires automatically
after 15 minutes.

AgentFence cannot yet act on this information: paste evaluation and blocking are built in
Milestone 4. Until then, recording a copy has no visible effect.

### Limits of copy detection

- Nothing is observed on a site you have not granted access to.
- Only a `copy` event with a non-empty text selection is observed. Copying an image,
  a file, or text a page writes to the clipboard via script without going through the
  browser's native copy (e.g. `navigator.clipboard.writeText` with no `copy` event) is
  not seen.
- An OS-level clipboard manager, another application, or a copy made outside the browser
  is not seen.
- The copy-detection script runs in an isolated world: it can read the page's rendered
  text and selection, but not the page's own JavaScript state.
