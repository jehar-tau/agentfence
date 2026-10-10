# AgentFence

**Stop AI agents from moving information where it doesn't belong.**

AgentFence is an open-source, local-first Chrome extension that protects browser-based AI
workflows from leaking information across work, personal, finance, health and client contexts.

> Status: early development. AgentFence can assign a context to a site, turn on protection for
> it, and close the loop: copying from one protected site and pasting into another is evaluated
> against your rules, with an in-page Allow/Ask/Block flow and a metadata-only activity history
> (7-day retention, clearable). A Visual Map shows your protected sites and the flows between
> them. A demo playground (`pnpm demo`) has five fake sites for trying this end to end, and a
> first-run walkthrough explains all of it. See [docs/product-spec.md](docs/product-spec.md).

## Quickstart

```bash
pnpm install
pnpm build
```

Then in Chrome: `chrome://extensions` → Developer mode ON → Load unpacked → select `dist/chrome`.

## Demo

```bash
pnpm demo
```

Starts five small fake sites — Bank, Work Chat, Client A, Client B, and a Public Form — each on
its own `*.localhost` hostname (no setup needed; see [docs/decisions.md](docs/decisions.md)).
Open the URLs it prints, assign each one a context from the AgentFence popup, then copy from one
and paste into another.

## Development

```bash
pnpm dev             # run with hot reload
pnpm lint
pnpm typecheck
pnpm test
pnpm build           # dist/chrome/
pnpm package         # dist/agentfence-chrome-v0.1.0.zip
pnpm test:e2e-smoke  # needs `pnpm build` and `pnpm exec playwright install chromium`
```
