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
