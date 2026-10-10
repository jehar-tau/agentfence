# Permissions

AgentFence asks for the smallest set of permissions it needs, at the latest possible moment.
This file lists every permission in the manifest. It is updated in the same change that adds or
removes a permission.

## `storage`

- **Why needed:** to save your site-to-context assignments.
- **When requested:** at install.
- **What AgentFence can do:** read and write its own data in `chrome.storage.local` on this device.
- **What AgentFence does not do:** sync that data anywhere, or read any other extension's or
  site's storage.

## `activeTab`

- **Why needed:** so the popup can show which site you are on and let you assign it a context.
- **When requested:** at install; it only takes effect when you click the AgentFence toolbar
  button.
- **What AgentFence can do:** see the URL of the tab you clicked the button on, for that click.
- **What AgentFence does not do:** see your other tabs, your browsing history, or any tab you have
  not opened the popup on. Only the hostname is stored, and only when you save a context.

## `scripting`

- **Why needed:** to run AgentFence's copy-detection script, but only on a site you have
  protected.
- **When requested:** at install. On its own it does nothing — it only takes effect together with
  the per-site access below.
- **What AgentFence can do:** run its own script on a page once that site is protected.
- **What AgentFence does not do:** run any script on a page you have not protected, or run
  anything other than AgentFence's own code.

## Per-site access (optional)

AgentFence declares `optional_host_permissions` for `https://*/*` and `http://*/*`, but none of
that is granted at install. A specific site's access (e.g. `https://chat.example.com/*`) is
requested only when you assign that site a context in the popup, through Chrome's own permission
prompt. Before asking, AgentFence shows:

> AgentFence needs access to this site to detect supported information transfers on it. Page
> content stays on your device.

- **Why needed:** to detect a `copy` event on that site and know which tab it happened in.
- **When requested:** when you set a context for a site (and again if you choose "Turn on copy
  protection" after declining). You can decline; the context is still saved, and AgentFence says
  plainly that it can't watch copies on that site yet.
- **What AgentFence can do, once granted:** read the page's rendered text and the current text
  selection, only on that site, only to detect a copy or a paste. On a copy, it stores a SHA-256
  hash of the copied text, its length, the site's domain, its context, the tab id, and a
  timestamp — in `chrome.storage.session`, cleared when the browser closes, and expired
  automatically after 15 minutes. On a paste into an editable field, it checks whether the
  pasted text matches a recent copy and, if your rules say to, can stop the paste and ask or
  block (see `docs/threat-model.md`).
- **What AgentFence does not do:** store or transmit the copied or pasted text itself, read the
  page before a copy or paste happens, or see anything on a site you have not protected.
  Removing a site's context (or revoking the permission from `chrome://extensions`) stops both
  on that site.

## Not requested

`tabs`, `clipboardRead`, `<all_urls>` as an install-time permission. AgentFence never reads the
system clipboard directly — only the text involved in a `copy` event on a protected site.
