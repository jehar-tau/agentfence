# Changelog

All notable changes to AgentFence are recorded here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Bootstrap**: Manifest V3 extension shell (WXT, TypeScript, React), linting,
  typechecking, unit and end-to-end test setup, CI, build and packaging.
- **Context engine**: the six context types, scoped client contexts
  (`client/acme`), hostname matching, versioned `chrome.storage.local` with
  migrations, and site-context assignment from the popup.
- **Rule engine**: deterministic flow evaluation (scoped → context →
  same-context → wildcard → fallback), the spec's default rules, and a Rules
  page to view, edit, and test them.
- **Copy provenance**: opt-in per-site protection via optional host
  permissions, a `copy` event watcher, SHA-256 hashing with a 15-minute TTL,
  and `docs/threat-model.md`.
- **Paste enforcement**: evaluates a paste's source against its destination
  and shows an in-page Allow/Ask/Block dialog; "Always allow" writes a real,
  editable rule.
- **Demo playground**: five synthetic sites (Bank, Work Chat, Client A,
  Client B, Public Form) on their own `*.localhost` hostnames, via
  `pnpm demo`.
- **Onboarding**: a first-run walkthrough covering context boundaries, the six
  contexts, protecting a site, the live default rules, and the demo. A
  polished popup with an obvious Rules / Visual Map entry point.
- **Visual Fence Map**: protected sites grouped by context, representative
  flows between them evaluated live through the rule engine, a details panel,
  and filters (All / Blocked / Asked / Allowed / Current site).
- **Activity history**: a metadata-only, 7-day log of paste decisions, visible
  and clearable from the Rules page; the popup's "Today: N blocked, N asked".
- Security hardening pass: explicit CSP, dependency pinning, an accessibility
  fix on the Visual Map, and a color-contrast fix.
- Public repository files: `LICENSE` (Apache-2.0), `CODE_OF_CONDUCT.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, `docs/privacy.md`, an
  extension icon, issue and pull request templates.

[Unreleased]: https://github.com/jehar-tau/agentfence/commits/main
