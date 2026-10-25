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

## Milestone 8

- **Recording is deferred until the outcome is known, not patched afterward.** For `ask`, no
  entry is written at evaluation time; `paste-watcher.ts` waits for the dialog to resolve and
  sends one `agentfence:record-activity` message with the final outcome (`blocked` /
  `allowed-once` / `always-allowed`). `allow` and `block` write immediately, since nothing further
  can change them. This means there is exactly one write per completed decision, never a
  "pending" row that needs to be found and updated later.
- **Stored in `chrome.storage.local`** (the same versioned object as sites and rules, schema v2→v3
  adding `activityHistory`), not `storage.session` like copy provenance — activity should survive
  a browser restart within its retention window, unlike the 15-minute copy cache.
- **7-day retention, pruned lazily** on the same read/write pattern used everywhere else in this
  project (copy provenance's 15-minute TTL, the schema migration itself): nothing proactive, no
  `alarms` permission.
- **The outcome label matches the spec's own wording exactly** — `describeOutcome()` produces
  "Asked · user blocked" verbatim for that case, and symmetric wording for the other two ask
  outcomes.
- **The popup's "Today: N blocked, N asked" line** (from the spec's popup mockup) is wired in now
  that there is real data to show — it was deliberately left out in Milestone 6 pending this. It
  counts by `decision` (what AgentFence did), not `outcome`, and is omitted entirely rather than
  shown as "0 blocked, 0 asked" when there is nothing to report yet.
- No new permissions.

## Milestone 9 — security hardening, permission audit, accessibility

A review pass, not new features. Findings and fixes:

**Fixed:**

- **Dependency pinning was broken.** `.npmrc` sets `save-exact=true`, but every entry in
  `package.json` had drifted to a caret range (`^19.3.0` etc.) despite the lockfile resolving
  exact versions underneath. Rewrote `package.json` to the exact versions already in
  `pnpm-lock.yaml` and regenerated the lockfile's specifiers to match; `pnpm install
--frozen-lockfile` now passes cleanly. Spec §23 asks for this explicitly.
- **Explicit CSP.** Added `content_security_policy.extension_pages: "script-src 'self';
object-src 'self'"`. This matches Chrome's MV3 default (nothing was actually permissive before),
  but makes the policy visible and auditable in the manifest rather than implicit. Deliberately
  left out `style-src`: the Visual Map positions node cards with computed inline `style={{...}}`
  attributes (no static class can express a runtime-computed pixel position), and MV3's
  `extension_pages` CSP enforcement for `style-src` is not something Chrome documents clearly
  enough to rely on either way — verified empirically instead (loaded the built extension, drove
  it to render the Visual Map with real data, watched the console: no CSP violations, the inline
  positions apply correctly). `script-src`/`object-src` are what the spec's security requirements
  actually care about (no eval, no remote code) and are unaffected by this.
- **A real accessibility bug in the Visual Map**: the edges `<svg>` had `role="img"`, which tells
  assistive tech to treat the whole graphic as one opaque image — hiding the individually
  focusable, clickable edge elements inside it from the accessibility tree. Changed to
  `role="group"`.
- **A color-contrast failure**: the "ask" orange used on the Visual Map (`#b36b00` on white) is
  4.18:1, under WCAG AA's 4.5:1 for normal text. Standardized on the darker orange already used on
  the onboarding page (`#8a5a00`, 5.93:1) everywhere "ask" is shown as text.

**Audited, no issues found:**

- No `eval`, `new Function`, remote script loading, or dynamic script downloading anywhere in the
  extension's own code (`innerHTML` only appears in test cleanup, never with untrusted content).
- No `console.*` calls outside tests — nothing sensitive logged.
- `pnpm audit`: no known vulnerabilities in any dependency.
- `docs/permissions.md` cross-checked line by line against the built manifest: accurate, nothing
  undocumented, nothing documented that isn't actually requested.
- The demo playground's server binds to `127.0.0.1` only (confirmed again, not just inherited from
  Milestone 5) — never reachable from the network.
- Heading hierarchy (h1→h2→h3) is correctly nested on every page, no raw `<img>` without alt text
  (none are used), no icon-only buttons without a text label, and no suppressed focus outlines
  anywhere in the codebase.
- The intervention dialog's focus trap, Escape handling, and ARIA labeling (built in Milestone 4)
  were re-reviewed and still hold up; no changes needed.

## Milestone 10 — public repo polish

- **All required public-launch files now exist** (spec §28): `LICENSE` (Apache-2.0),
  `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `CONTRIBUTING.md`, `SECURITY.md`,
  `ROADMAP.md`, `CHANGELOG.md`, `docs/privacy.md`, alongside the `AGENTS.md`,
  `docs/threat-model.md`, and `docs/permissions.md` that already existed.
- **Icon**: a simple shield-with-fence-posts SVG, rendered to the four manifest sizes
  (16/32/48/128) via a headless Playwright screenshot rather than adding an image-processing
  dependency (e.g. `sharp`) just for this. Lives under `public/`, WXT's convention for files
  copied to the build output as-is (as opposed to `extension/assets/`, which is for
  code-imported assets) — the manifest's `icons` paths are absolute (`/icon-16.png`) accordingly.
- **Social preview** (1280×640, spec §30) and the **Visual Map screenshot** used in the README
  were both generated the same way: a static HTML/SVG page screenshotted with Playwright at the
  exact target size, not hand-drawn in an external tool. The Visual Map one seeds real storage
  with the demo playground's five sites through the service worker, so it's a screenshot of the
  actual product, not a mockup.
- **No hero GIF/video.** Recording and editing a demo video is outside what this session's
  tooling can do (no screen-recording capability). The README's demo section gives the exact
  steps instead, and the Visual Map screenshot stands in as the one visual. Recording the GIF
  from the spec's shot list (§35) is a good first task for the user or a contributor once the
  repo is public.
- **Copyright line uses "AgentFence contributors"**, the standard open-source convention, since
  there's no registered entity name to attribute the license to.
- **What's deliberately left undone here, on purpose**: going public, enabling GitHub's
  Dependabot/secret-scanning/code-scanning/private-vulnerability-reporting (spec §31 explicitly
  times these to _after_ public anyway), and anything involving a Chrome Web Store developer
  account (registration, fees) or an actual account sign-up elsewhere. These are the user's call,
  not something to flip silently. Seeding starter issues and cutting a GitHub Release with the
  packaged zip (spec §32, §36) are done as direct repository actions after this PR merges, not as
  part of it, since they aren't branch content.

## Milestone 11 — Chrome Web Store packaging prep

- **Prepared everything short of an account**: listing copy (name, short/detailed description,
  category), three 1280×800 screenshots generated the same way as earlier milestones' (seeded
  real data through the service worker, screenshotted with Playwright — not mockups), privacy
  practices answers and permission justifications derived directly from `docs/permissions.md`,
  and a submission checklist, all in `docs/chrome-web-store-listing.md`.
- **Registering a developer account is explicitly not done here.** It requires a one-time fee and
  creates an account — both outside what should happen without the account owner directly doing
  it. The checklist says so plainly rather than silently skipping the step.
- **Confirmed the production ZIP's manifest sits at the package root** (`unzip -l`), which the
  spec calls out explicitly (§39 step 2) as something to verify, not assume from the build tool.
- **A small (440×280) promo tile is the one graphic genuinely not ready** — it needs actual
  design work, not just a differently-cropped screenshot of the running extension the way the
  three listing screenshots are. Left for whoever does the submission.

## Closing the native-permission-prompt gap in E2E coverage (issue #20)

Researched before building anything, per the issue's own framing ("actually find out whether
that's fixable, not to assume it isn't"):

- **CDP's `Browser.grantPermissions`/`Browser.setPermission`** cover site permissions
  (geolocation, notifications, clipboard, etc.) — nothing analogous exists for an extension's
  `chrome.permissions.request` on a specific origin.
- **Playwright's maintainers were asked directly** and declined: a 2026 feature request
  ([microsoft/playwright#32755](https://github.com/microsoft/playwright/issues/32755)) asking for
  exactly this (`browser.permissionsDialog.confirm()`/`.reject()`) was closed with "Playwright
  focuses on testing web platform features" — extension optional-permission prompts are
  explicitly out of scope, not a gap they're planning to fill.
- **No Chrome enterprise policy auto-grants an extension's optional permissions.**
  `ExtensionSettings`'s `runtime_blocked_hosts`/`runtime_allowed_hosts` restrict what an
  _already-granted_ permission can do; they don't grant one. Chrome's own docs are explicit that
  `permissions.request()` must be called from within a user gesture — there is no documented way
  around that for an automated test.

So the issue's third option — a test-only seam — is what's implemented, and chosen to be as thin
as possible:

- **The deviation lives entirely in `wxt.config.ts`'s manifest, not in any application code.**
  `pnpm build:e2e` (which `pnpm test:e2e-smoke` now runs itself) sets `WXT_E2E_TEST_BUILD=true`,
  which makes the demo playground's five origins **required** `host_permissions` instead of
  optional — Chrome auto-grants required permissions on load, with no prompt at all. Every line
  of `background.ts`, the content scripts, and the enforcement/dialog logic runs completely
  unaware of and unmodified by this flag; `reconcileSiteWatchers` already treats any currently
  granted permission the same regardless of whether it came from the manifest or a runtime
  grant, so the real content scripts register and run exactly as they would for a real user who
  clicked "Allow" on the native prompt.
- **Confirmed, not assumed, that this never reaches the shipped build**: `pnpm build` and
  `pnpm package` (no `build:e2e`) produce a manifest with no `host_permissions` key at all.
  `dist/e2e/` is a separate output directory from `dist/chrome/`, both still covered by the
  existing `dist/` gitignore entry.
- **`extension/tests/e2e/real-enforcement-flow.spec.ts`** is the payoff: two tests that do what
  every other e2e test couldn't — a real `document.getSelection()` + `Ctrl/Cmd+C` on the real
  demo playground (started per-test via a new `playgroundServer` fixture), a real `Ctrl/Cmd+V`
  into a real `contenteditable` composer, the real copy-watcher/paste-watcher content scripts,
  the real in-page Shadow DOM dialog, and a real Block (text never lands) and a real seamless
  same-context allow (text does land, no dialog). The one non-extension-specific gap — Playwright
  itself has no native clipboard — uses Playwright's own well-supported
  `context.grantPermissions(['clipboard-read', 'clipboard-write'])`, unrelated to the extension's
  permission model entirely.
- **Hit, and fixed, the same storage-migration pitfall as the Milestone 7/10/11 screenshots**:
  writing `domainContexts` directly via the service worker without first letting a real
  `loadState()` call run leaves no `schemaVersion` on the written object, so the _next_ real
  `loadState()` (e.g. when the background evaluates the copy) sees version 0 and re-runs every
  migration from scratch — including the one that resets `domainContexts` to `[]`. Fixed by
  visiting `options.html` once (`warmUpStorage`) before seeding, the same fix used earlier this
  session for the Visual Map and Chrome Web Store screenshots.

**Verified** `pnpm build` and `pnpm package` are unaffected (no `host_permissions` in that
manifest) and all 8 e2e tests (6 existing + 2 new) pass together via the normal
`pnpm test:e2e-smoke` from a clean `dist/`.
