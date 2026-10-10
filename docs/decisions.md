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
