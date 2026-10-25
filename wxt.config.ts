import { defineConfig } from 'wxt';

// Set only by `pnpm build:e2e`, never by `pnpm build`/`pnpm package` — see
// docs/decisions.md ("closing the native-permission-prompt gap") and AGENTS.md #18.
const isE2eTestBuild = process.env.WXT_E2E_TEST_BUILD === 'true';

// The demo playground's five origins (playground/server.mjs). Chrome's permission prompt for
// granting these is native UI that Playwright cannot drive, so a test build lists them as
// required host_permissions instead of optional — Chrome auto-grants required permissions on
// load, no prompt at all. This is the ONLY difference from the real build: every line of
// extension code (background.ts, the content scripts, the enforcement/dialog logic) runs
// completely unaware of and unmodified by this flag. It only ever affects a build that is
// never shipped or packaged.
const E2E_TEST_HOST_PERMISSIONS = [
  'http://bank.localhost/*',
  'http://work-chat.localhost/*',
  'http://client-a.localhost/*',
  'http://client-b.localhost/*',
  'http://public-form.localhost/*',
];

export default defineConfig({
  srcDir: 'extension',
  outDir: isE2eTestBuild ? 'dist/e2e' : 'dist',
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
    ...(isE2eTestBuild ? { host_permissions: E2E_TEST_HOST_PERMISSIONS } : {}),
    // Explicit, even though it matches Chrome's MV3 default: no remote code, no eval, no
    // inline/remote scripts, nothing but AgentFence's own bundled files. See docs/decisions.md.
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    icons: {
      16: '/icon-16.png',
      32: '/icon-32.png',
      48: '/icon-48.png',
      128: '/icon-128.png',
    },
  },
});
