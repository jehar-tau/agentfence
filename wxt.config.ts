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
    // Permissions are added in the milestone that first needs them. See docs/decisions.md.
  },
});
