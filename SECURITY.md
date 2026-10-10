# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a security vulnerability.

Report it privately using [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
for this repository: go to the **Security** tab → **Report a vulnerability**. If
that option isn't available to you, open a [private security advisory draft](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/creating-a-repository-security-advisory)
or contact a maintainer directly through their GitHub profile.

Please include:

- What you found and why it's a vulnerability
- Steps to reproduce it
- The affected version (and browser, if relevant)
- Any suggested fix, if you have one

We'll acknowledge your report, investigate, and keep you updated as we work on
a fix. We ask that you give us a reasonable amount of time to address the issue
before disclosing it publicly.

## Supported versions

AgentFence is pre-1.0. Security fixes land on the latest released version;
there is no separate maintenance branch yet.

## Scope

AgentFence's own code: the extension (`extension/`), the demo playground server
(`playground/server.mjs`, which only ever binds to `127.0.0.1`), and build
tooling. See [docs/threat-model.md](docs/threat-model.md) for what AgentFence
does and does not claim to protect against — a report that something outside
that scope isn't covered usually isn't a vulnerability in AgentFence itself,
but we're still glad to hear about it.

## What we consider a vulnerability here

Examples: a protected site's data leaking to a site it shouldn't, raw copied or
pasted text being stored or transmitted anywhere, a way to bypass a Block
decision, a way to read or affect data on a site the user has not granted
AgentFence access to, or a permission being used beyond what
[docs/permissions.md](docs/permissions.md) describes.
