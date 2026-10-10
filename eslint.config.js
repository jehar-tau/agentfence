import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', '.wxt/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    // The demo playground's static file server: plain Node, not bundled by WXT/Vite.
    files: ['playground/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
