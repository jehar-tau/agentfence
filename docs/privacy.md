# Privacy

AgentFence is local-first. This page is the plain-language version; see
[docs/permissions.md](permissions.md) for exactly what each Chrome permission
does, and [docs/threat-model.md](threat-model.md) for what AgentFence can and
cannot see.

## What's true today, in v0.1

- **Everything is processed on your device.** Site assignments, rules,
  activity history, and the short-lived copy cache all live in your
  browser's local extension storage. None of it is sent anywhere.
- **No account, no sign-up, no login.**
- **No backend.** There is no AgentFence server. Nothing to breach, nothing
  collecting your data, because nothing is listening.
- **No sale of data.** There's no data collection to sell in the first place.
- **No advertising, no ad SDK, no third-party analytics or trackers.**
- **Raw text is never stored.** A copy is recorded as a SHA-256 hash, its
  character length, the source domain, and the context you assigned that
  site — never the text itself. The hash lets a later paste be matched
  against it without AgentFence (or anyone) being able to recover what was
  copied from the hash.
- **Nothing is watched until you say so.** AgentFence requests access to a
  specific site only when you assign that site a context, through Chrome's
  own permission prompt — never for every site at once.

## What's stored, and for how long

| Data                                                                             | Where                    | Kept for                                                  |
| -------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| Site → context assignments, rules                                                | `chrome.storage.local`   | Until you remove them                                     |
| Copy provenance (hash, length, domain, context, tab id, timestamp)               | `chrome.storage.session` | 15 minutes, or until the browser closes                   |
| Activity history (timestamp, contexts, domains, decision, outcome, matched rule) | `chrome.storage.local`   | 7 days, and you can clear it any time from the Rules page |

None of these rows ever contain the copied or pasted text itself.

## What AgentFence does not do

- Read your browsing history.
- Read page content on a site you have not protected.
- Upload clipboard contents, page text, or browsing history to any server.
- Use a cloud AI model, or send any of your data to one.
- Track you across sites for advertising or any other purpose.

## Future versions

If a later version adds optional features like cross-device sync or team
policies — which would need a server — that will be opt-in, disclosed here
before it ships, and this page will say plainly what changed.

## Questions

Open an issue, or see [SECURITY.md](../SECURITY.md) if what you have is a
vulnerability report rather than a question.
