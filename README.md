# AgentFence

**Stop AI agents from moving information where it doesn't belong.**

AgentFence is an open-source, local-first Chrome extension that protects browser-based AI
workflows from leaking information across work, personal, finance, health and client contexts.

> Status: early development. AgentFence can assign a context to a site, turn on protection for
> it, and now close the loop: copying from one protected site and pasting into another is
> evaluated against your rules, with an in-page Allow/Ask/Block flow. See
> [docs/product-spec.md](docs/product-spec.md).

## Quickstart

```bash
pnpm install
pnpm build
```

Then in Chrome: `chrome://extensions` → Developer mode ON → Load unpacked → select `dist/chrome`.

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
