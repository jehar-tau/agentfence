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
  },
});
