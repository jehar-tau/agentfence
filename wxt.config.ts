import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'extension',
  outDir: 'dist',
  outDirTemplate: '{{browser}}',
  modules: ['@wxt-dev/module-react'],
  zip: {
    artifactTemplate: '{{name}}-{{browser}}-v{{version}}.zip',
  },
  manifest: {
    name: 'AgentFence',
    short_name: 'AgentFence',
    description: 'Stop sensitive information from crossing the wrong browser contexts.',
    // Permissions are added in the milestone that first needs them. See docs/permissions.md.
    permissions: ['storage', 'activeTab', 'scripting'],
    // Requested per-site, only once the user assigns that site a context. See
    // core/provenance/site-protection.ts and docs/permissions.md.
    optional_host_permissions: ['https://*/*', 'http://*/*'],
    // Explicit, even though it matches Chrome's MV3 default: no remote code, no eval, no
    // inline/remote scripts, nothing but AgentFence's own bundled files. See docs/decisions.md.
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
});
