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
