# Chrome Web Store listing

Everything needed to submit AgentFence to the Chrome Web Store, ready to copy in. This is
preparation only — **submitting requires a Chrome Web Store developer account (a one-time
registration fee), which is the account owner's to create, not something done on their behalf.**
See [Submission checklist](#submission-checklist) for what's done here versus what's left.

## Listing copy

**Name**

```text
AgentFence
```

**Short description** (132 characters max)

```text
Stop sensitive information from crossing the wrong browser contexts.
```

**Detailed description**

```text
AgentFence is a local-first context firewall for AI-assisted browser workflows.

It helps prevent sensitive information from moving between contexts such as:

• Finance → Public
• Health → Work
• Client A → Client B

AgentFence evaluates supported browser transfers locally and can allow, ask or
block according to rules you control.

No account required.
No cloud AI required.
No raw page content stored on our servers.

HOW IT WORKS

Assign a context to a site — Work, Personal, Finance, Health, a scoped Client, or
Public — from the toolbar popup, and grant AgentFence access to that one site.
Copy something on a protected site and AgentFence records a local hash of it
(never the text itself). Paste on a protected site, and AgentFence checks
whether it matches a recent copy, resolves both contexts, and evaluates your
rules. A same-context paste goes through silently; anything else shows an
in-page dialog — Block, Allow once, or Always allow.

A Visual Fence Map shows your protected sites grouped by context and the flows
between them. A metadata-only activity history (7 days, clearable) records
what was decided.

PRIVACY

Everything runs on your device. There is no AgentFence server, no account, no
telemetry, no third-party analytics, and no ad SDK. Raw copied or pasted text
is never stored — only a hash, used to recognize the same text again later.
Full policy: see the privacy policy link below.

LIMITATIONS

AgentFence helps with accidental cross-context copy/paste in the browser. It
does not protect against a compromised browser, OS-level malware, other
browser extensions, screenshots/OCR, or anything outside the browser. See the
project's threat model (linked below) for the full picture.

This is an open-source project (Apache License 2.0). Source, issues, and
contributions: https://github.com/jehar-tau/agentfence
```

**Category**

```text
Productivity
```

**Language**

```text
English (United States)
```

## Graphics

| Asset                         | Size     | File                                                                              | Status                 |
| ----------------------------- | -------- | --------------------------------------------------------------------------------- | ---------------------- |
| Extension icon                | 128×128  | [`public/icon-128.png`](../public/icon-128.png)                                   | ✅ ready               |
| Small promo tile              | 440×280  | —                                                                                 | ❌ not made            |
| Marquee promo tile            | 1400×560 | —                                                                                 | ❌ not made (optional) |
| Screenshot — Rules & Activity | 1280×800 | [`docs/assets/store/rules-and-activity.png`](assets/store/rules-and-activity.png) | ✅ ready               |
| Screenshot — Visual Fence Map | 1280×800 | [`docs/assets/store/visual-map.png`](assets/store/visual-map.png)                 | ✅ ready               |
| Screenshot — Onboarding       | 1280×800 | [`docs/assets/store/onboarding.png`](assets/store/onboarding.png)                 | ✅ ready               |

The Chrome Web Store requires at least one 1280×800 (or 640×400) screenshot; the three above
cover it. A promo tile is required for featuring/search placement but not for a basic listing —
left for later since it needs design the extension's own UI screenshots don't give directly
(the social preview at [`docs/assets/social-preview.png`](assets/social-preview.png), built for
GitHub's 1280×640 social card, is a reasonable starting point to adapt down to 440×280 if needed).

## Privacy practices disclosure

The Chrome Web Store's listing form asks for a plain answer on data use. Based on what's actually
in the code (see [docs/privacy.md](privacy.md) for the full policy):

- **Does this item collect or use any of the following?** No to every category on Chrome's list
  (personally identifiable information, health info, financial/payment info, authentication info,
  personal communications, location, web history, user activity, website content). AgentFence
  processes copied/pasted text locally to compute a hash and never transmits or stores the text,
  and nothing it stores ever leaves the device.
- **Single purpose**: detecting and controlling cross-context information transfers (copy/paste)
  in the browser, based on user-defined rules.
- **Permission justifications** (for the form's per-permission text boxes — full detail in
  [docs/permissions.md](permissions.md)):
  - `storage`: save the user's site-to-context assignments, rules, and activity history, locally.
  - `activeTab`: let the popup show which site the user is on, only when they click the toolbar
    icon.
  - `scripting`: run AgentFence's own copy/paste-detection script, only on a site the user has
    explicitly protected.
  - Host permissions (optional, granted per-site): detect a copy or paste on a site the user has
    chosen to protect. Requested one origin at a time, never at install.
- **Privacy policy URL**: once public, `https://github.com/jehar-tau/agentfence/blob/main/docs/privacy.md`
  (GitHub renders markdown directly; this works as a policy URL as-is).

## Support

- **Website**: `https://github.com/jehar-tau/agentfence`
- **Support URL / email**: GitHub Issues — `https://github.com/jehar-tau/agentfence/issues`

## Submission checklist

Prepared here:

- [x] Listing copy (name, descriptions, category)
- [x] Three 1280×800 screenshots
- [x] Icon (128×128, already in the packaged build)
- [x] Privacy practices answers
- [x] Permission justification text
- [x] Production ZIP (`pnpm package` → `dist/agentfence-chrome-v0.1.0.zip`), manifest confirmed
      at the package root

Needs the account owner, not done here:

- [ ] Register a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole/)
      (one-time registration fee)
- [ ] A small (440×280) promo tile graphic
- [ ] Upload the ZIP and paste in the copy above
- [ ] Choose a distribution visibility (private/trusted testers → unlisted → public is the spec's
      recommended sequence, [docs/product-spec.md](product-spec.md) §39)
- [ ] Submit for review

Per the spec ([docs/product-spec.md](product-spec.md) §28), none of this should happen before the
GitHub repository itself is public and the quickstart has been verified on a clean machine.
