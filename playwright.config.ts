import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'extension/tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
});
