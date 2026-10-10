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

## Not requested

No host permissions, no `tabs`, no `scripting`, no `<all_urls>`. AgentFence currently has no
content scripts and cannot read page content.
