# AgentFence — Chrome Extension Product & Build Specification
## Open-source context firewall for AI-assisted browser workflows

**Version:** 1.2  
**Date:** 2026-10-10  
**Audience:** Codex, Claude Code, Kimi Code, Cursor, Copilot, or another coding harness  
**Goal:** Build, test, publish, and launch a useful Chrome/Chromium extension that people can install, star on GitHub, and contribute to.

---

# 0. Executive Summary

AgentFence is a local-first Chrome extension that helps prevent sensitive information from crossing the wrong digital contexts.

```text
FINANCE → WORK           ASK
FINANCE → PUBLIC         BLOCK
HEALTH → PUBLIC          BLOCK
CLIENT A → CLIENT B      BLOCK
WORK → PERSONAL          ASK
SAME CONTEXT             ALLOW
```

The first product should do one thing extremely well:

> Detect supported browser-based information transfers, determine source and destination contexts, and Allow, Ask, or Block according to user-controlled rules.

The first memorable demo:

```text
Bank page
  ↓
copy sensitive information
  ↓
Slack-like work page
  ↓
paste
  ↓
AgentFence
FINANCE → WORK
  ↓
BLOCK / ALLOW ONCE
```

The project must be:

- open source
- local-first
- no account required
- no cloud backend required
- no LLM required
- privacy-respecting
- Manifest V3
- easy to install from GitHub
- suitable for Chrome Web Store publication
- include a small visual fence map/canvas so users can understand how fencing is applied
- extensible later to MCP / SDK / desktop / enterprise products

---

# 1. Product Positioning

## GitHub headline

> **AgentFence — stop AI agents from moving information where it doesn't belong.**

## Short description

> Open-source context firewall for AI-assisted browser workflows.

## Consumer explanation

> Keep AI assistants from mixing your work, personal, finance, health and client information.

## Technical explanation

> AgentFence tracks supported browser transfer provenance, resolves source/destination contexts, evaluates deterministic local information-flow rules, and interrupts unsafe transfers when browser APIs allow reliable intervention.

Do not lead with observability, lineage, enterprise governance, semantic catalogs, compliance, or DLP jargon.

---

# 2. Core Insight

Traditional permissions answer:

```text
Can this assistant access Slack?
Can this assistant access Gmail?
Can this assistant access a bank page?
```

AgentFence asks:

```text
Should information learned in FINANCE
be allowed to flow into WORK?
```

The problem is not always unauthorized access. It may be the composition of two individually legitimate permissions.

```text
Bank access   ✓
Slack access  ✓

Bank information → Slack   ✕
```

AgentFence governs that flow.

---

# 3. v0.1 Scope

Build only:

1. Chrome / Chromium extension
2. Manifest V3
3. context assignment for sites
4. six default context types
5. scoped clients such as Client A / Client B
6. deterministic local rule engine
7. exact copy/paste provenance using local hashing
8. ALLOW / ASK / BLOCK
9. intervention UI
10. local metadata-only activity history
11. onboarding
12. popup
13. settings/rules page
14. a small visual fence map / canvas page inside the extension
15. unsafe demo playground
16. automated tests
17. packaged extension ZIP
18. GitHub-ready repository
19. Chrome Web Store-ready assets/documentation

Do **not** build before public v0.1:

- backend
- login
- payments
- remote database
- hosted policy engine
- MCP gateway
- Snowflake
- Databricks
- Atlan
- desktop application
- mobile application
- semantic enterprise layer
- cloud LLM classifier
- universal agent monitoring
- network-wide DLP

---

# 4. Backend / Frontend Decision

## Frontend

The extension is the product frontend.

Surfaces:

```text
Chrome popup
Options/settings page
Onboarding page
In-page intervention dialog
Activity history
Visual Fence Map page
Demo playground
```

## Backend

**No backend for v0.1.**

Use:

```text
chrome.storage.local
chrome.storage.session where appropriate
Web Crypto API
extension service worker
content scripts
```

A backend should only be introduced later for:

- cross-device sync
- team policies
- central administration
- central audit
- paid accounts

The absence of a backend is an advantage:

```text
No signup
No server costs
No cloud content storage
No secrets to manage
```

---

# 5. Technology Stack

Use:

```text
TypeScript
React
Manifest V3
WXT preferred
Vite where needed
pnpm
Vitest
Playwright
ESLint
Prettier
Web Crypto API
Chrome Extension APIs
```

Start with **WXT** if it cleanly handles Manifest V3, service worker, content scripts, popup/options pages, build and package.

If WXT becomes limiting, use direct Vite + Manifest V3. Document any framework change in `docs/decisions.md`.

---

# 6. Repository Structure

```text
agentfence/
├── extension/
│   ├── entrypoints/
│   │   ├── background.ts
│   │   ├── content.ts
│   │   ├── popup/
│   │   ├── options/
│   │   ├── onboarding/
│   │   └── visual-map/
│   ├── components/
│   │   └── canvas/
│   ├── core/
│   │   ├── context/
│   │   ├── policy/
│   │   ├── provenance/
│   │   ├── transfer/
│   │   ├── storage/
│   │   ├── activity/
│   │   └── graph/
│   ├── styles/
│   ├── assets/
│   └── tests/
├── playground/
│   ├── bank/
│   ├── work-chat/
│   ├── client-a/
│   ├── client-b/
│   └── public-form/
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   ├── threat-model.md
│   ├── privacy.md
│   ├── permissions.md
│   ├── decisions.md
│   ├── release.md
│   └── launch.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── AGENTS.md
├── README.md
├── ROADMAP.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
├── package.json
└── pnpm-lock.yaml
```

---

# 7. Root AGENTS.md

Create immediately:

```md
# AgentFence Development Rules

1. Read docs/product-spec.md before coding.
2. Build one milestone at a time.
3. v0.1 has no backend.
4. Keep all user data local.
5. Never send page text, clipboard text or browsing history to an external server.
6. Never store raw clipboard contents in history.
7. Use deterministic policy evaluation.
8. Use minimum Chrome permissions.
9. Prefer optional host permissions.
10. Do not request <all_urls> as an install-time permission unless technically unavoidable.
11. Do not use remote executable code.
12. Do not require an LLM.
13. Never claim AgentFence observes actions it cannot technically observe.
14. If a block cannot be guaranteed, show a warning rather than claiming success.
15. Every core feature requires automated tests.
16. Security-sensitive changes must update docs/threat-model.md when appropriate.
17. The demo must use only synthetic information.
18. Do not add unrelated architecture.
19. Keep main runnable.
20. At the end of each task, report files changed, commands run, tests, limitations and manual verification.
```

---

# 8. Manifest Requirements

Use Manifest V3.

Illustrative manifest:

```json
{
  "manifest_version": 3,
  "name": "AgentFence",
  "short_name": "AgentFence",
  "version": "0.1.0",
  "description": "Stop sensitive information from crossing the wrong browser contexts.",
  "permissions": ["storage", "activeTab", "scripting"],
  "optional_host_permissions": ["https://*/*", "http://*/*"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "options_page": "options.html"
}
```

Generated paths can differ by framework. Verify final output.

---

# 9. Permission Philosophy

AgentFence is security software and must not look like spyware.

> Ask for the smallest possible permissions at the latest possible moment.

Prefer required permissions:

```text
storage
activeTab
scripting
```

Use optional host permissions.

Example:

```text
User chooses:
Protect slack.com
```

Then request only the relevant origin.

Before requesting host access show:

```text
AgentFence needs access to this site to detect supported
information transfers on it.

Page content stays on your device.
```

---

# 10. Privacy Requirements

v0.1 must have:

```text
No account
No backend
No telemetry by default
No ad SDK
No third-party analytics
No raw clipboard uploads
No page-text uploads
No cloud AI
```

Allowed stored metadata:

```text
site/domain
context
rule
decision
timestamp
hash
length
action type
```

Avoid:

```text
raw message
raw clipboard
password
token
bank number
full uploaded file
```

---

# 11. Core Data Model

```ts
type ContextType =
  | "work"
  | "personal"
  | "finance"
  | "health"
  | "client"
  | "public"
  | "unknown";

interface ContextRef {
  type: ContextType;
  scope?: string;
}

interface DomainContext {
  id: string;
  pattern: string;
  context: ContextRef;
  enabled: boolean;
  source: "default" | "user";
  createdAt: number;
  updatedAt: number;
}

type FlowDecision = "allow" | "ask" | "block";

interface FlowRule {
  id: string;
  source: ContextRef | "*";
  destination: ContextRef | "*";
  decision: FlowDecision;
  priority: number;
  enabled: boolean;
  createdBy: "default" | "user";
  description?: string;
}

interface SourceEvidence {
  sourceTabId?: number;
  sourceUrl?: string;
  sourceDomain?: string;
  sourceContext: ContextRef;
  capturedAt: number;
  contentHash?: string;
  contentLength?: number;
  confidence: "exact" | "inferred" | "unknown";
}

interface TransferAttempt {
  id: string;
  timestamp: number;
  source: SourceEvidence;
  destinationUrl: string;
  destinationDomain: string;
  destinationContext: ContextRef;
  actionType: "paste" | "submit" | "upload" | "other";
  policyDecision: FlowDecision;
  matchedRuleId?: string;
}
```

---

# 12. Default Rules

Seed:

```text
SAME → SAME              ALLOW

FINANCE → PUBLIC         BLOCK
HEALTH → PUBLIC          BLOCK

FINANCE → WORK           ASK
HEALTH → WORK            ASK

PERSONAL → WORK          ASK
WORK → PERSONAL          ASK

CLIENT:A → CLIENT:B      BLOCK
CLIENT:* → PUBLIC        ASK

UNKNOWN → *              ASK
* → UNKNOWN              ASK
```

Rules are editable.

Priority:

```text
1. exact scoped rule
2. exact context rule
3. same-context rule
4. wildcard rule
5. fallback
```

Fallback:

```text
ASK
```

---

# 13. Provenance Tracking

The first reliable mechanism is exact copy/paste provenance.

## Copy

On copy from a protected site:

1. obtain copied/selected text available to the event
2. normalize it
3. SHA-256 hash locally
4. resolve source context
5. save short-lived metadata only

Store:

```text
hash
character length
source domain
source URL optional
source context
tab ID
timestamp
confidence=exact
```

Do not store copied text.

## Normalization

Before hashing:

```text
Unicode normalize
CRLF → LF
trim leading/trailing whitespace
conservative whitespace normalization
```

## Hashing

Use:

```text
crypto.subtle.digest("SHA-256", ...)
```

Default TTL:

```text
15 minutes
```

Remove expired entries automatically.

---

# 14. Paste Evaluation

On paste:

1. obtain pasted text available to event
2. normalize
3. hash
4. find recent exact source match
5. resolve destination context
6. evaluate rule
7. ALLOW / ASK / BLOCK

If exact provenance is unknown:

```text
do not pretend the source is known
```

Ship exact matching first. Add heuristics later only if user feedback justifies them.

---

# 15. Enforcement

## ALLOW

Permit action.

## ASK

Prevent transfer where technically reliable, then show:

```text
Context crossing

Finance → Work

Copied from:
bank.example

Pasted into:
work-chat.example

[Block]
[Allow once]
[Always allow Finance → Work]
```

## BLOCK

Prevent supported transfer and show:

```text
Blocked by AgentFence

Finance → Public is not allowed.

[Review rule]
```

## Enforcement honesty

If a complex page/editor cannot be blocked reliably:

```text
AgentFence detected a risky transfer,
but reliable blocking is not supported on this page yet.
```

Never claim "Blocked" when the action was not actually stopped.

---

# 16. v0.1 Actions

Required:

```text
copy provenance
paste evaluation
```

Next after launch:

```text
form-submit
file-upload
drag-drop
bulk-fill
```

Do not claim support until tested.

---

# 17. UX Requirements

## Intervention dialog

Must be:

- plain language
- keyboard accessible
- not color-only
- source and destination visible
- rule visible
- action buttons obvious
- focus managed correctly

## Popup

```text
AgentFence            ON

Current site
work-chat.example

Context
WORK

Protected
Yes

Today
2 blocked
4 asked

[Change context]
[Activity]
[Rules]
[Visual Map]
```

The popup may show "Visual Map" as either:

- a primary quick action button, or
- an item inside a small overflow/drop-down menu

The user specifically requested that the visual view be accessible from the extension menu. Therefore the extension must include an obvious entry point in the popup/drop-down for opening the visual canvas.

## Onboarding

Under 60 seconds:

1. explain context boundaries
2. show Work / Personal / Finance / Health / Client / Public
3. ask user to protect/classify a site
4. show default rules
5. launch demo

## Options

Sections:

```text
Contexts
Sites
Rules
Activity
Visual Map
Privacy
About
```

---

# 18. Activity History

Metadata only.

Example:

```text
19:04
Finance → Work
bank.demo → work-chat.demo
Blocked

18:55
Client A → Client B
client-a.demo → client-b.demo
Asked · user blocked
```

Default retention:

```text
7 days
```

Provide:

```text
Clear history
```

---

# 19. Visual Fence Map

AgentFence v0.1 must include a small visual canvas that helps users understand
how fencing has been applied across their protected sites.

This visual map is **not** meant to become a giant standalone application in
v0.1. It is a compact explainer and inspection surface inside the extension.

## Entry point

The visual map must be reachable from the extension popup/menu via:

```text
Visual Map
```

Selecting this option should open a dedicated extension page, for example:

```text
visual-map.html
```

or the equivalent route generated by the framework.

## Purpose

The visual map should answer:

```text
What sites are protected?
What context is each site in?
Which flows are allowed / asked / blocked?
Why was a flow blocked or flagged?
How are Client A and Client B fenced apart?
```

## Visual language

Use the uploaded lineage HTML only as **visual inspiration**.
Do not clone it literally.

Desired visual cues:

- light clean dashboard style
- dotted or lightly gridded canvas
- grouped containers by context
- cards for protected sites
- colored arrows/edges for flows
- green = allowed
- orange = ask
- red = blocked
- optional right-side details panel when a node or edge is selected
- compact, extension-friendly layout

## v0.1 canvas contents

Show:

1. protected sites grouped by context
2. representative flows between them
3. the currently selected or most recent flow
4. matched rule for that flow
5. confidence level (exact / inferred / unknown)
6. simple counts such as blocked / asked / allowed

The map can be built from:

- current protected sites
- configured context assignments
- configured rules
- recent activity history

## Recommended visual structure

A good default layout is:

```text
left rail    = legend / filters / contexts
center area  = visual canvas
right panel  = selected flow details
```

## Node model

Each protected site should appear as a compact card showing:

- site name
- hostname
- context badge
- optional short descriptor such as "Sensitive financial data" or "Team discussions"

## Edge model

Each visible connection/flow should show:

- source → destination
- current decision (allow / ask / block)
- optional label such as "Finance → Work"

## Interaction model

### Clicking a site/node

Shows:

- full hostname
- context
- whether site protection is enabled
- flows in/out of that node
- quick action to edit site context

### Clicking a flow/edge

Shows:

- source site
- destination site
- source context
- destination context
- rule used
- decision
- confidence
- timestamp if it came from recent activity
- CTA to open or edit the rule

### Filters

At minimum support:

- All flows
- Blocked only
- Asked only
- Allowed only
- Current site related flows

## Scope discipline

For v0.1 the visual map should be **read-only or mostly read-only**.

Allowed lightweight actions:

- open rule
- jump to site settings
- filter flows

Avoid turning the map into a complex drag-drop graph editor before launch.

## Rendering approach

The coding harness may use one of:

- custom SVG rendering
- React Flow or similar lightweight graph library
- DOM/CSS absolute layout if it keeps bundle size low

Selection criteria:

- lightweight
- accessible enough
- easy to style
- no heavy backend assumptions

## Default demo state

The visual map should have a polished demo state using the playground data:

```text
Finance    → Work      Ask
Finance    → Public    Block or Allow depending on demo choice
Client A   → Client B  Block
```

This visual should be usable in README screenshots and launch materials.

---

# 20. Demo Playground

Create local fake pages:

```text
Bank
Work Chat
Client A
Client B
Public Form
```

Run:

```bash
pnpm demo
```

Synthetic bank data:

```text
Account holder
Alex Demo

Balance
₹8,42,520

Demo account
XXXX-DEMO-0000
```

Synthetic Client A:

```text
ACME Demo Corp
Confidential launch price: ₹4,50,000
```

Synthetic Client B:

```text
Globex Demo Corp
```

---

# 21. Killer Demo

```text
Open Bank Demo
↓
Copy ₹8,42,520
↓
Open Work Chat Demo
↓
Paste
↓
Exact source match
↓
Finance → Work
↓
ASK
↓
Click Block
↓
Paste does not occur
```

Record this as hero GIF/video.

Secondary:

```text
Client A → Client B
BLOCK
```

---

# 22. Threat Model

Helps with:

- accidental cross-context copy/paste
- browser-based agent transfer
- wrong-client leakage
- sensitive-to-public transfer
- user error in AI-assisted browser workflows

Does not claim protection from:

- malicious browser extensions
- compromised browser
- OS malware
- invisible server-to-server activity
- native desktop automation
- screenshots/OCR outside browser
- direct APIs
- other side channels

Document this publicly.

---

# 23. Security Requirements

Mandatory:

```text
Manifest V3
No eval
No remote executable JavaScript
Strict CSP
No dynamic script downloading
Minimal dependencies
Dependency pinning
No secrets in repo
No sensitive raw logs
```

---

# 24. Testing

Unit tests:

```text
context matching
scoped client matching
rule priority
same-context
wildcards
fallback
normalization
hashing
TTL cleanup
storage migrations
```

Integration:

```text
finance → work = ask
finance → public = block
work → work = allow
client A → client B = block
unknown → work = ask
```

E2E with Playwright:

```text
demo opens
protected context recognized
copy stores hash provenance
paste invokes dialog
block prevents transfer
allow once works
always allow creates rule
```

---

# 25. CI

GitHub Actions on PR and main:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e-smoke
```

---

# 26. Build Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm package
pnpm demo
```

Outputs:

```text
dist/chrome/
dist/agentfence-chrome-v0.1.0.zip
```

---

# 27. Local Install

README quickstart:

```bash
git clone https://github.com/<OWNER>/agentfence.git
cd agentfence
pnpm install
pnpm build
```

Then:

```text
Chrome
→ chrome://extensions
→ Developer mode ON
→ Load unpacked
→ select dist/chrome
```

Run demo:

```bash
pnpm demo
```

---

# 28. GitHub Strategy

Start private.

Go public only when:

```text
demo works
quickstart works on clean machine
README is ready
SECURITY.md exists
LICENSE exists
CI passes
```

Recommended license:

```text
Apache-2.0
```

Required files before public:

```text
README.md
LICENSE
AGENTS.md
ROADMAP.md
CHANGELOG.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
docs/product-spec.md
docs/threat-model.md
docs/privacy.md
docs/permissions.md
```

---

# 29. README Structure

Use:

```text
# AgentFence
one sentence
hero GIF
what it does
quickstart
demo
visual map screenshot
why this exists
how it works
privacy
limitations
roadmap
contributing
security
license
```

Recommended opening:

```md
# 🛡️ AgentFence

**Stop AI agents from moving information where it doesn't belong.**

AgentFence is an open-source, local-first Chrome extension that protects
browser-based AI workflows from leaking information across work, personal,
finance, health and client contexts.

![AgentFence blocking Finance → Work](docs/assets/demo.gif)

## Why?

An AI assistant may legitimately have access to both your bank and Slack.

That does not mean information from your bank should be allowed into Slack.
```

---

# 30. GitHub Metadata

Description:

```text
Stop AI agents from moving information where it doesn't belong. Open-source context firewall for browser AI workflows.
```

Topics:

```text
ai-agents
agent-security
ai-security
browser-extension
chrome-extension
privacy
local-first
information-flow
data-loss-prevention
security
open-source
mcp
```

Social preview:

```text
1280 × 640
```

Suggested copy:

```text
AgentFence

Stop AI agents from moving
information where it doesn't belong.

FINANCE → WORK        ASK
FINANCE → PUBLIC      BLOCK
CLIENT A → CLIENT B   BLOCK
```

---

# 31. GitHub Security

Enable after public:

- Dependabot alerts
- secret scanning
- push protection
- code scanning if applicable
- private vulnerability reporting

Create `SECURITY.md`.

Never ask researchers to disclose vulnerabilities in a public issue.

---

# 32. Issues and Community

Issue templates:

```text
Bug
Feature
False positive
False negative
```

Labels:

```text
good first issue
help wanted
bug
security
false-positive
false-negative
ux
docs
browser-compatibility
rules
performance
```

Seed about 10 real issues before launch, including 3–5 good-first-issues.

Examples:

```text
Wildcard domain matching UI
Keyboard navigation in intervention dialog
History export
Client-scope rule editor
File-upload demo
Firefox feasibility
Unknown-context onboarding
Rule import/export
Trusted-site bypass
E2E coverage
```

Enable GitHub Discussions after public launch:

```text
Announcements
Ideas
Help
Show & Tell
Rules
```

---

# 33. Roadmap

```text
v0.1
Chrome extension + exact copy/paste context protection

v0.2
Better site/context classification
File upload protection

v0.3
@agentfence/core npm package

v0.4
MCP proxy experiment

v0.5
Desktop / Agent SDK experiments
```

No dates.

---

# 34. GitHub Stars Strategy

Never:

- buy stars
- use fake accounts
- exchange stars
- gate features behind starring
- spam unrelated communities
- manipulate GitHub Trending

The star loop should be:

```text
see 20-second demo
↓
understand immediately
↓
open repo
↓
install quickly
↓
run same demo
↓
find useful
↓
star
↓
share
```

Optimize for usefulness, clarity, install speed and demo quality.

---

# 35. Hero Demo

30 seconds, readable without audio:

```text
0–5 sec
Bank Demo
Copy ₹8,42,520

6–10 sec
Open Work Chat

11–15 sec
Paste

16–21 sec
AgentFence:
Finance → Work

22–25 sec
Block

26–30 sec
AgentFence
Stop AI agents from moving information where it doesn't belong.
```

---

# 36. Launch Sequence

## Phase 1 — Private alpha

10–20 users.

Questions:

```text
Can they install without help?
Do they understand context rules?
Does it break pages?
Are warnings annoying?
```

## Phase 2 — Public GitHub

Publish repository.

Create release:

```text
v0.1.0
```

Attach ZIP.

## Phase 3 — Personal network

Share video on LinkedIn/X.

## Phase 4 — Hacker News

Title:

```text
Show HN: AgentFence – stop AI agents from moving information across contexts
```

## Phase 5 — Relevant communities

Tailor posts. Do not spam.

## Phase 6 — Chrome Web Store

Submit after alpha issues are fixed.

---

# 37. Show HN Draft

```text
Show HN: AgentFence – stop AI agents from moving information across contexts

AI assistants increasingly have access to multiple parts of our digital lives.

Existing permissions answer whether an assistant can access Gmail, Slack or a
bank page. They don't necessarily answer whether information learned in one
context should be allowed to flow into another.

AgentFence is an experimental open-source Chrome extension for context-based
information-flow controls.

Examples:

Finance → Public = Block
Finance → Work = Ask
Client A → Client B = Block

v0.1 runs entirely locally, requires no account and stores no raw copied text.
The initial implementation focuses on exact copy/paste provenance in
browser-observable workflows.

It does NOT see server-side agent actions and does not claim universal agent
protection.

I'd especially like feedback on:
1. whether context boundaries are useful
2. false positives
3. which agent/browser workflows should be protected next

GitHub: ...
```

---

# 38. Social Launch Draft

```text
AI agents can access more of your digital life every month.

But:

"can access my bank"
+
"can access Slack"

should not mean:

"can move bank data into Slack."

I'm building AgentFence — an open-source context firewall for browser-based AI workflows.

Runs locally.
No account.
No cloud content storage.

[video]
[GitHub]
```

---

# 39. Chrome Web Store Publishing

## Step 1 — Developer account

Register a Chrome Web Store developer account.

Use an email you control long-term.

Complete the current developer agreement, registration fee, and account-security requirements.

## Step 2 — Production ZIP

Run:

```bash
pnpm package
```

Create:

```text
agentfence-chrome-v0.1.0.zip
```

Verify the manifest is at the expected package root.

## Step 3 — Listing

Prepare:

```text
name
short description
detailed description
icon
screenshots
website
support URL
privacy policy
```

## Step 4 — Privacy disclosures

Explain:

```text
what is read
why access is needed
what is stored
where it is stored
what is transmitted externally
```

For v0.1:

```text
No external transmission by default.
```

## Step 5 — Distribution sequence

Recommended:

```text
Private / trusted testers
↓
Unlisted
↓
Public
```

All store distributions still need to comply with review/policy requirements.

## Step 6 — Public store launch

After approval:

- add Web Store badge/link near top of README
- keep manual GitHub installation instructions
- publish release notes
- update social launch posts

---

# 40. Chrome Web Store Listing Copy

Name:

```text
AgentFence
```

Short description:

```text
Stop sensitive information from crossing the wrong browser contexts.
```

Opening:

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
```

Do not overstate universal protection.

---

# 41. Permissions Documentation

Create:

```text
docs/permissions.md
```

For each permission explain:

```text
Permission
Why needed
When requested
What AgentFence can do
What AgentFence does not do
```

---

# 42. Privacy Page

Publish a simple privacy policy.

State implementation truth:

```text
Data processed locally
No sale of data
No advertising data collection
No raw clipboard transmission
No browsing-history upload
No third-party analytics in v0.1
```

---

# 43. 30-Day Build Plan

Days 1–2:
Milestone 0 — bootstrap.

Days 3–4:
Milestone 1 — contexts.

Days 5–6:
Milestone 2 — rules.

Days 7–9:
Milestone 3 — copy provenance.

Days 10–12:
Milestone 4 — paste enforcement.

Days 13–14:
Milestone 5 — playground.

**At this point, stop adding architecture and record the first demo.**

Days 15–17:
onboarding + popup.

Days 18–20:
activity + UX.

Days 21–23:
security/tests.

Days 24–25:
private alpha.

Days 26–27:
fix alpha issues.

Days 28–29:
README/GIF/release.

Day 30:
public GitHub launch.

This is a target sequence, not a promise.

---

# 44. Coding Harness Milestones

## Milestone 0 — Bootstrap

Build:

- Manifest V3 shell
- TypeScript
- React popup
- pnpm
- Vitest
- ESLint
- Prettier
- GitHub CI
- build/package

Prompt:

```text
Read AGENTS.md and docs/product-spec.md completely.

Implement ONLY Milestone 0.

Create a Manifest V3 Chrome/Chromium extension named AgentFence using TypeScript
and React. Prefer WXT if it stays simple.

Add:
- pnpm
- linting
- typecheck
- Vitest
- Playwright-ready setup
- GitHub Actions CI
- production build
- packaged ZIP
- popup displaying "AgentFence is active"

Do not implement:
- context detection
- policy engine
- copy/paste tracking
- backend
- cloud services
- analytics
- MCP
- AI models

Run all checks.

Report:
1. files changed
2. commands run
3. test results
4. manual Chrome install steps
5. limitations
6. explicit statement that later milestones were not implemented
```

## Milestone 1 — Context Engine

Prompt:

```text
Implement ONLY Milestone 1.

Add ContextRef:
work, personal, finance, health, client, public, unknown.

Client contexts support scope:
client/acme
client/globex

Allow current-site assignment from popup.
Persist with chrome.storage.local.
Add schema versioning/migrations and tests.

Do not implement policy rules or transfer blocking.
```

## Milestone 2 — Rule Engine

Prompt:

```text
Implement ONLY Milestone 2.

Build deterministic flow policy evaluation.

Input:
source ContextRef
destination ContextRef

Output:
allow | ask | block
matched rule
reason

Implement priority from the spec.
Add defaults, rules UI and unit tests.

Do not capture page content.
```

## Milestone 3 — Copy Provenance

Prompt:

```text
Implement ONLY Milestone 3.

On protected sites:
- detect copy events
- normalize copied text
- hash locally with SHA-256
- store only hash, length, source domain, context, tab ID, timestamp and exact confidence
- TTL 15 minutes
- never persist raw copied text

Add tests.
```

## Milestone 4 — Paste Enforcement

Prompt:

```text
Implement ONLY Milestone 4.

On paste:
1. normalize text
2. hash
3. find exact recent source
4. resolve destination
5. evaluate flow rule
6. allow / ask / block

ASK:
Block, Allow once, Always allow this flow.

BLOCK:
prevent only where technically reliable.

If blocking is unreliable, warn honestly instead of claiming success.

Add E2E tests.
```

## Milestone 5 — Playground

Prompt:

```text
Implement ONLY Milestone 5.

Build synthetic local pages:
Bank Demo
Work Chat Demo
Client A
Client B
Public Form

Add pnpm demo.

Make Finance→Work and Client A→Client B work end-to-end.

No backend.
```

## Milestone 6 — Onboarding + Popup

Build:

- onboarding
- polished popup
- obvious "Visual Map" entry in popup or overflow menu
- permission explanations

## Milestone 7 — Visual Fence Map

Build:

- dedicated extension page for the visual map
- grouped context containers
- protected site cards
- colored flow edges
- selection/details panel
- filters for Blocked / Asked / Allowed
- hookup to recent activity and configured rules

Prompt:

```text
Implement ONLY Milestone 7.

Create a Visual Fence Map page inside the extension. The user must be able to
open it from the popup/menu through an item labeled "Visual Map".

Requirements:
- Use the uploaded lineage HTML only as visual inspiration, not as a direct clone.
- Show protected sites grouped by context.
- Show representative flows between sites.
- Use green/orange/red visual language for allowed/asked/blocked flows.
- Support selecting a node or edge to show details.
- Show rule, source context, destination context, confidence, and recent status.
- Keep v0.1 read-only except for links/actions that open rule or site settings.
- Make the playground data render well in this canvas so it can be used in README screenshots.

Do not build a full drag-drop graph editor.
```

## Milestone 8 — Activity History

Build metadata-only activity history.

## Milestone 9 — Security Hardening

Security hardening + permission audit + accessibility.

## Milestone 10 — Public Repo Polish

README + hero GIF + visual map screenshot + social preview + public repo files + release ZIP.

## Milestone 11 — Chrome Web Store

Chrome Web Store packaging/submission preparation.

---

# 45. Harness Completion Contract

After every milestone require:

```text
FILES CHANGED
COMMANDS RUN
TEST RESULTS
KNOWN LIMITATIONS
SECURITY/PRIVACY IMPACT
MANUAL VERIFICATION
WHAT WAS DELIBERATELY NOT BUILT
```

---

# 46. Founder Setup — Exact Steps

1. Create GitHub repo:
   ```text
   agentfence
   ```
   Keep private initially.

2. Clone locally.

3. Create:
   ```text
   AGENTS.md
   docs/product-spec.md
   ```

4. Put this file at:
   ```text
   docs/product-spec.md
   ```

5. Commit:
   ```bash
   git add .
   git commit -m "docs: add AgentFence product specification"
   git push
   ```

6. Give coding harness Milestone 0 prompt.

7. Review and run:
   ```bash
   pnpm install
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

8. Load unpacked extension into Chrome.

9. Commit milestone:
   ```text
   chore: bootstrap AgentFence Chrome extension
   ```

10. Continue one milestone at a time.

---

# 47. Branch Strategy

```text
main
feat/context-engine
feat/rule-engine
feat/provenance
feat/enforcement
feat/playground
```

Use PRs even as a solo founder for meaningful/security-sensitive changes.

---

# 48. Public Launch Gate

Do not make the repository public until a stranger can:

```text
open repo
understand project in 10 seconds
install in a few minutes
run demo
see an intervention
understand limitations
```

---

# 49. Success Signals

Primary:

```text
active installs
weekly retention
false-positive rate
people keeping extension installed
external issues
external pull requests
requests for MCP/Claude Code/Codex support
```

Secondary:

```text
GitHub stars
forks
release downloads
social shares
```

---

# 50. Future Expansion

Only after v0.1 evidence:

```text
AgentFence Core
↓
MCP proxy
↓
Agent SDK
↓
Team policies
```

Potential integrations later:

```text
Claude Code
Codex
Kimi Code
OpenAI Agents
custom agents
```

The visual fence map can later become the seed for a more advanced DecisionTrace-style view, but v0.1 should keep it compact and extension-focused.

---

# 51. DecisionTrace Relationship

Keep the original lineage idea in the long-term architecture:

```text
AgentFence
controls flows
↓
creates trusted events
↓
DecisionTrace
explains what happened
```

Do not build DecisionTrace into Chrome v0.1.

---

# 52. Kill / Pivot Signals

Reconsider if:

- users refuse the required permissions
- context rules are confusing
- false positives become annoying
- browser-visible flows are not where agent activity happens
- people install only for the demo and uninstall
- nobody asks for broader agent protection

Positive pivot signal:

```text
Can this protect Claude Code?
Can this sit in front of MCP?
Can my team deploy these rules centrally?
```

---

# 53. Official References to Recheck Before Release

Chrome Manifest V3:
https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3

Chrome permissions:
https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions

Chrome Permissions API:
https://developer.chrome.com/docs/extensions/reference/api/permissions

Chrome privacy guidance:
https://developer.chrome.com/docs/extensions/develop/security-privacy/user-privacy

Chrome Web Store:
https://developer.chrome.com/docs/webstore

Chrome developer registration:
https://developer.chrome.com/docs/webstore/register/

Chrome distribution:
https://developer.chrome.com/docs/webstore/cws-dashboard-distribution

GitHub repository best practices:
https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories

GitHub README:
https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes

GitHub topics:
https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics

GitHub security:
https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository

GitHub social preview:
https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview

---

# 54. The One Rule

If a proposed feature does not improve:

```text
Bank → Slack demo
trust
privacy
install speed
clarity
reliability
```

do not add it before public launch.

# END
