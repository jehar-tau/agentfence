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

## What AgentFence can currently act on (as of Milestone 4)

On a `paste` event into an editable field on a site you have granted access to, AgentFence
normalizes and hashes the pasted text, looks for a matching copy it recorded in the last 15
minutes, and evaluates the source → destination flow against your rules. It always prevents
the browser's native paste first — the decision needs to ask the background script, which is
asynchronous — then either completes the paste immediately (Allow), or shows an in-page dialog
(Ask) or a blocked notice (Block) before deciding whether to.

**If no matching copy is found, the source is treated as `unknown`, never guessed.** A paste of
text that was typed directly, copied more than 15 minutes ago, or copied from a site that was
not protected is evaluated as coming from an unknown context (the `UNKNOWN → *` rule, which
asks by default).

### Limits of paste enforcement

- Blocking is reliable in the sense that matters most: once AgentFence intercepts a paste, the
  original native paste never happens, regardless of the decision.
- Completing an **allowed** paste (automatically, or after the user clicks "Allow once" /
  "Always allow") is done with `document.execCommand('insertText', …)`, a deprecated but still
  broadly supported API, and the only one that reliably re-inserts text into both plain form
  fields and `contenteditable` elements after the native paste has already been stopped. It
  always inserts **plain text**, even if the original clipboard held rich/HTML formatting — a
  real, visible side effect, not a security gap.
- If that insertion fails for any reason, AgentFence shows a warning rather than claiming the
  paste completed (see AGENTS.md #14); it does not retry silently.
- If the background cannot be reached to evaluate a paste at all, AgentFence says so and lets
  the paste through rather than silently blocking or silently allowing an unexamined paste.
- Only a `paste` event into a field AgentFence recognizes as editable (a standard form field, or
  an element with `contenteditable`) is intercepted. A paste handled entirely by a page's own
  script without going through the native `paste` event is not seen.
- A copy made from an unprotected site, or from outside the browser entirely, has no recorded
  provenance, so a paste of that text is evaluated as `unknown`, not blocked outright — matching
  the rules you have set for unknown sources.
