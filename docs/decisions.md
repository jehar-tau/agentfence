# Decisions

## Milestone 0

- **Framework: WXT.** It handles the Manifest V3 service worker, popup, build and ZIP packaging
  without custom tooling. The extension source lives in `extension/` (`srcDir`); config and
  tooling live at the repo root.
- **Build output.** `outDir` is `dist` with `outDirTemplate: '{{browser}}'`, so the unpacked build
  is `dist/chrome/` and the package is `dist/agentfence-chrome-v0.1.0.zip`, as the spec requires.
- **No permissions yet.** The manifest declares no permissions or host permissions in Milestone 0
  because nothing uses them. `storage`, `activeTab`, `scripting` and optional host permissions are
  added in the milestone that first needs each one.
- **TypeScript pinned to 6.0.x.** `typescript-eslint` 8 does not support TypeScript 7 yet.
- **Dependencies are pinned** to exact versions (`save-exact=true`) per the security requirements.
- **Tests.** Unit tests (`*.test.ts[x]`, Vitest) and the Playwright smoke test (`*.spec.ts`) live
  under `extension/tests/`. The smoke test loads the built `dist/chrome` into Chromium, so it
  needs `pnpm build` first.

## Milestone 1

- **Sites are identified by hostname.** A pattern is either an exact hostname (`chat.example.com`)
  or a subdomain wildcard (`*.example.com`). An exact hostname never implicitly covers subdomains,
  so assigning `example.com` does not silently classify `mail.example.com`. Exact matches beat
  wildcards; among wildcards the longest wins. The popup only creates exact-hostname entries;
  wildcards are supported by the matcher for the later Sites settings page.
- **`unknown` is not assignable.** It is what a site resolves to when nothing is assigned.
- **Client contexts require a scope**, normalized to lowercase `a-z0-9-` (`client/acme`). Other
  context types never carry a scope.
- **One versioned state object** lives under the `agentfence:state` key in `chrome.storage.local`.
  `MIGRATIONS[n]` upgrades schema version `n` to `n + 1`; version 0 means "nothing stored". Data
  written by a newer schema than the build supports is rejected rather than downgraded.
- **Permissions added: `storage`, `activeTab`.** See `docs/permissions.md`.
- **Popup UI is covered by a jsdom component test, not Playwright.** Playwright cannot click the
  toolbar button, and opening `popup.html` in a tab does not receive the `activeTab` grant, so the
  popup cannot see another tab's URL in an automated browser run. The real toolbar flow is a
  manual check.

## Milestone 2

- **Rule tiers.** A matching rule is placed in one tier, tried in the spec's order: exact scoped
  rule (no `*`, at least one client scope) → exact context rule (no `*`, no scope) → same-context
  rule → wildcard rule (any `*`) → fallback `ask`. Within a tier the order is: more specific
  endpoints, higher `priority`, user rule over default, more restrictive decision, then id. The
  result never depends on the order rules are stored in.
- **`{ type: 'client' }` without a scope means "any client".** That is how `CLIENT:* → PUBLIC` is
  stored.
- **`client → client` without scopes means "a different client".** This is how the spec's
  `CLIENT:A → CLIENT:B` default is stored. It does not match a client flowing to itself, which
  falls through to the same-context rule.
- **`unknown` is never "the same context".** Two unassigned sites are not known to belong
  together, so `unknown → unknown` is decided by the `unknown → *` rule (ask), not allowed.
- **The same-context rule is a flagged rule** (`sameContext: true`), an addition to the spec's
  `FlowRule` type, so it can be edited or turned off like any other rule.
- **One rule per source → destination pair.** Saving a pair that already has a rule updates that
  rule instead of adding a competing one. Default rules can be changed or turned off but not
  deleted; "Reset rules to defaults" restores them.
- **Schema version 2** adds `flowRules`, seeded with the defaults.
- **Rules UI lives on a new options page** (opens in a tab), reachable from the popup's "Rules"
  button. It includes a "Check a flow" tool that runs the evaluator without saving anything. No
  new permissions.

## Milestone 3

- **Copy detection is opt-in per site, via Chrome's own optional host permissions**, not an
  install-time grant. `optional_host_permissions` declares `https://*/*` / `http://*/*` in the
  manifest (nothing is granted from that alone), and `core/provenance/site-protection.ts` requests
  only the one origin the user is protecting, right when they assign that site a context in the
  popup — showing the spec's explanation text first. Declining is a normal outcome: the context is
  still saved, and the popup says plainly that copy protection is off.
- **No static content script.** The copy watcher is a WXT _unlisted script_
  (`entrypoints/copy-watcher.ts`, builds to `copy-watcher.js`, not referenced anywhere in the
  manifest). The background service worker registers it with
  `chrome.scripting.registerContentScripts` for exactly the granted origins, and un/re-registers
  as `chrome.permissions.onAdded` / `onRemoved` fire — including a permission revoked from
  `chrome://extensions` rather than from AgentFence's own UI — plus a reconciliation pass on
  `onStartup` / `onInstalled`.
- **The content script only reports an event; it never writes storage.** It posts
  `{ type: 'agentfence:copy', text, href }` to the background, which normalizes, hashes, resolves
  the source context, and is the only place that writes `chrome.storage.session`. This keeps the
  one thing that must never happen (storing raw text) in one reviewable place.
- **Stored fields match the spec's list** (hash, length, source domain, source context, tab id,
  timestamp, confidence) with one deliberate omission: `source URL`, which the spec marks
  optional. Domain is enough to resolve a context and, later, to match a paste's destination;
  leaving out the full URL keeps the stored footprint smaller.
- **TTL is lazy, like the schema migration pattern**: an entry older than 15 minutes is dropped
  the next time anything reads or writes the store, not by a background timer. No `alarms`
  permission is requested for this. Session storage is also cleared outright when the browser
  closes.
- **Normalization is conservative**: Unicode NFC, CRLF/CR → LF, trim, and only runs of 2+ spaces
  or tabs collapse to one. Newlines and single spaces are left alone, so hashing stays a reliable
  match for the same copy without being so aggressive that unrelated text could coincide.
- **Manual-only, like the Milestone 1 toolbar flow:** Chrome's permission prompt is native browser
  UI, not a page element, so Playwright cannot click it. The grant/decline paths, and the resulting
  hash recorded for a real copy, need a manual check (steps in the PR description); everything else
  — normalization, hashing, storage/TTL, the message handler, and every state the popup's
  protection UI can be in — is covered by unit and component tests using fakes for
  `chrome.permissions` and `chrome.scripting`.
- Added `docs/threat-model.md` (AGENTS.md rule 16: security-sensitive changes must update it).

## Milestone 4

- **Paste detection reuses Milestone 3's per-site permission exactly.** No new permission is
  requested; the same grant that enables copy detection on a site also enables paste detection
  there. `core/enforcement/site-watcher-registration.ts` (renamed from the Milestone 3 provenance
  module, which it still calls into) registers `copy-watcher.js` and `paste-watcher.js` together,
  as two files in one `chrome.scripting.registerContentScripts` entry per origin.
- **Every intercepted paste is prevented first, synchronously**, because the decision needs an
  async round trip to the background (hash lookup + rule evaluation) and `ClipboardEvent` data is
  only available synchronously. An **allowed** paste is then completed by re-inserting the text
  with `document.execCommand('insertText', …)`. This is the one real, documented trade-off of this
  design: the reinserted text is always plain text, even if the clipboard held rich formatting.
  See `docs/threat-model.md`.
- **The in-page Ask/Block dialog is built with plain DOM + Shadow DOM**, not React — it's injected
  into every page the user protects, so keeping it small and immune to the host page's CSS (and
  vice versa) mattered more than reusing the popup's component style. It implements its own
  focus trap (Tab cycles only the dialog's buttons) and treats Escape as the safe default: Block
  for an Ask dialog, Dismiss for a Block notice.
- **"Always allow" writes a real rule** via the existing `upsertRule` from Milestone 2 (a new
  `agentfence:always-allow` message), so it shows up and can be edited or removed on the Rules
  page like any other rule — no separate "remembered choices" list.
- **Unmatched provenance is `unknown`, never guessed** — text typed directly, copied more than 15
  minutes ago, or copied from a site that wasn't protected all evaluate as `unknown → *`, which
  asks by default. This was already true of the rule engine (Milestone 2); this milestone is the
  first to actually feed it a real, possibly-missing match.
- **E2E scope, same honest limit as Milestones 1 and 3**: the full grant → copy → paste → dialog
  flow needs a real permission grant, which Playwright cannot drive (native browser UI). The
  existing Playwright smoke/rules specs confirm the built extension (now with two unlisted
  scripts and the expanded manifest) still loads and runs correctly; the paste pipeline itself —
  normalization, hashing, provenance matching, rule evaluation, message routing, the dialog's
  structure/ARIA/keyboard behavior, and the "always allow" rule write — is covered by 31 new unit
  tests using fakes, the same approach used for Milestone 3's permission/scripting APIs. The PR
  description has manual verification steps for the live flow.

## Milestone 5

- **Demo "sites" use the `*.localhost` TLD, not `/etc/hosts`.** AgentFence's context and
  permission model is keyed by hostname, so the five demo pages need five distinct hostnames to
  act like real separate sites. Browsers (Chrome included) resolve any `*.localhost` hostname to
  the loopback address on their own — no hosts-file edit, no setup step. `pnpm demo` starts one
  Node server (`playground/server.mjs`, built-in `http` only, no framework) that routes purely on
  the `Host` header: `bank.localhost:5300`, `work-chat.localhost:5300`, and so on all hit the same
  process and port.
- **This server is demo/dev tooling, not "the backend"** AGENTS.md #3 rules out — that rule is
  about the extension's own architecture (no account, no cloud policy engine, no hosted anything
  for the product itself). The playground is an explicit v0.1 deliverable (spec §3 #15, §20) and
  needs _some_ way to serve local pages with distinct origins.
- **Not covered by `pnpm test`.** It's manual-use tooling for a human to click through (same as
  the spec's own framing, "unsafe demo playground"), so it's verified by hand instead: running the
  server and confirming each hostname serves the right page, a shared asset loads from any host,
  an unrecognized host falls back to the landing page, and a `..` in the path is contained. This
  is a deliberate scope choice, not an oversight.
- **Synthetic data matches the spec exactly** (AGENTS.md #17): the bank balance, demo account
  number, and both client names and the confidential price are the spec's own placeholder values,
  nothing else.
- **Both input styles are covered across the five sites**: Work Chat's message box is a
  `contenteditable` composer (styled like a chat app); Client B's notes and the Public Form are
  plain `<textarea>` fields — between them, every paste target type AgentFence's paste listener
  recognizes gets exercised somewhere in the demo.

## Milestone 6

- **Onboarding is one scrollable page, not a click-through wizard.** The spec lists five things
  to cover "under 60 seconds" (context boundaries, the six contexts, protecting a site, the
  default rules, the demo) as _content_, not interaction steps. A single page a user can skim or
  scroll is faster to get through and far less code than wizard state management.
- **The default-rules section on the onboarding page is live, not a hardcoded copy.** It calls
  the same `listRules` used by the Rules page, so it can never drift out of sync with reality,
  including a rule the user has already changed.
- **The permission explanation is copied verbatim** from the popup (Milestone 3 / spec §9), shown
  before the user ever triggers the real prompt, so the wording the user sees in both places
  always matches.
- **Onboarding opens on first install only**, via `browser.runtime.onInstalled`'s
  `reason === 'install'` — never on an update or a `wxt dev` reload, which both fire the same
  event with a different reason.
- **"Launch demo" is a plain link to `http://localhost:5300/`, not an automated step.** The
  extension cannot start `pnpm demo`'s Node process itself, and AGENTS.md #13 rules out
  pretending it can; the page says plainly that the command needs to be run first.
- **The Visual Map popup button already opens a real page in Milestone 6**, not a dead link — a
  small honest stub (`entrypoints/visual-map/`) that says what it will become and links to the
  Rules page for now. Milestone 7 replaces its content; the entry point and the route the spec
  asks for already exist and are tested now.
- **No new permissions.** Opening the extension's own pages in a new tab (`tabs.create` with a
  `chrome-extension://` URL) does not require the `tabs` permission — only reading _other_ tabs'
  URLs does.
- Popup copy "AgentFence is active" is kept (not renamed to "ON") to avoid churning the
  Milestone 0 test it originated from for a wording-only change; it's now styled as a status
  badge to match the spec's popup mockup more closely.

## Milestone 7

- **No Activity History yet (that's a later milestone), so edges are rule-derived, not
  event-derived.** The map can't show "what happened" because nothing is recorded yet beyond the
  15-minute copy-provenance cache. Instead, for every pair of distinct contexts actually present
  among the user's protected sites, it runs the real rule engine
  (`core/map/build-map.ts`) and draws the edge that evaluation produces. This means the map is
  always a true, live answer to "what would AgentFence do right now" — including for the demo
  playground's five sites, which exactly reproduces the spec's example flows (verified in
  `build-map.test.ts`). Once Activity History exists, real recent events can be layered in or
  shown alongside these.
- **Layout is a pure function of counts, not measured from the DOM.** One column per distinct
  context (a client scope gets its own column), fixed card/gap sizes, position computed
  arithmetically (`core/map/layout.ts`). This avoids `getBoundingClientRect`/`ResizeObserver`
  entirely, which also means layout is trivially unit-testable and behaves identically in tests
  and a real browser — no flake from measuring an unpainted DOM.
- **Edges are SVG, nodes are HTML buttons**, layered together (SVG absolutely positioned under an
  HTML layer at the same coordinates). Keeps every interactive element a real, keyboard-reachable
  button/clickable path rather than fighting SVG's weaker accessibility story for interactive
  content.
- **"Confidence" is shown as honestly unavailable** on a selected edge ("this is what the rule
  says, not a recorded event") rather than inventing or omitting the field silently — matches
  AGENTS.md #13/#14.
- **"Current site" filter** is powered by a `?site=hostname` query parameter the popup's "Visual
  Map" button now appends when a real site is active, read by `visual-map/main.tsx`. Opening the
  map with no site context (e.g. from `chrome://extensions`) just omits that filter option.
- **Scope discipline followed per spec §19**: read-only, only non-destructive actions are "open
  settings" links (to the existing Rules page — there is no dedicated Sites page yet, so the
  links go to Options generally, worded honestly). No drag-and-drop, no editing on the canvas
  itself.
