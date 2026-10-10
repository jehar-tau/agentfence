# Contributing to AgentFence

Thanks for considering a contribution. AgentFence is early (v0.1) and still
settling, so small, focused changes are easiest to review and merge.

## Before you start

Read [AGENTS.md](AGENTS.md) and [docs/product-spec.md](docs/product-spec.md).
AGENTS.md's rules apply to every change, human or AI-assisted:

- Keep all user data local. Nothing AgentFence does sends page text, clipboard
  text, or browsing history to an external server.
- Use the minimum Chrome permissions a change needs; prefer optional host
  permissions over broad ones.
- Policy evaluation stays deterministic — no LLM, no heuristics that aren't
  reproducible.
- Every core feature needs automated tests.
- If a change is security-sensitive, update [docs/threat-model.md](docs/threat-model.md).
- Never claim AgentFence did something (blocked a paste, observed an action)
  that it technically could not do.

## Setup

```bash
git clone https://github.com/<owner>/agentfence.git
cd agentfence
pnpm install
```

## Everyday commands

```bash
pnpm dev             # run the extension with hot reload
pnpm lint             # eslint + prettier --check
pnpm format           # prettier --write
pnpm typecheck
pnpm test             # vitest
pnpm build             # dist/chrome/
pnpm package           # dist/agentfence-chrome-v0.1.0.zip
pnpm test:e2e-smoke     # playwright, needs `pnpm build` and `pnpm exec playwright install chromium` first
pnpm demo               # the synthetic demo playground, http://bank.localhost:5300/ etc.
```

A PR should pass all of `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
and `pnpm test:e2e-smoke` before it's ready for review — the same checks CI
runs.

## Branches and pull requests

Branch names describe the change: `feat/...`, `fix/...`, `docs/...`,
`chore/...`. Open a pull request even for a small change — issues tagged
`good first issue` are a good place to start, and `help wanted` issues are
open for anyone.

When your change touches behavior, say in the PR description what changed,
why, and anything a reviewer should check by hand — AgentFence has a few
things (native permission prompts, the real browser clipboard) that
automated tests genuinely can't drive; `docs/decisions.md` has examples of
how prior PRs wrote those up.

## Project layout

```text
extension/
├── entrypoints/   popup, options, onboarding, the Visual Map, background,
│                  and the two per-site content scripts (copy/paste watchers)
├── core/          the actual logic, organized by concern (context, policy,
│                  provenance, enforcement, activity, map, storage) — this is
│                  what's unit tested
└── tests/         unit tests (vitest) and end-to-end tests (playwright, in
                   tests/e2e/)
playground/        the synthetic demo sites and the server that hosts them
docs/              product spec, decisions log, threat model, permissions,
                   privacy policy
```

`core/` is deliberately decoupled from `chrome.*` — storage, permissions, and
scripting are all accessed through small interfaces (see `KeyValueArea`,
`PermissionsArea`, `ScriptingArea`) so logic can be unit tested against
in-memory fakes instead of a real browser. Keep new logic there rather than
in an entrypoint file where possible.

## Reporting bugs

Use the Bug issue template. For a false positive (AgentFence intervened when
it shouldn't have) or a false negative (it should have intervened and didn't),
use those specific templates instead — they ask for the two contexts and the
rule involved, which is usually enough to reproduce.

## Security issues

Please don't open a public issue for a security vulnerability — see
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree your contributions are licensed under the
project's [Apache License 2.0](LICENSE).
