import path from 'node:path';
import { chromium, expect, test } from '@playwright/test';

const extensionPath = path.resolve('dist/chrome');

test('built extension loads and the popup shows the active status', async () => {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  try {
    const serviceWorker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const extensionId = new URL(serviceWorker.url()).host;

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByText('AgentFence is active')).toBeVisible();
  } finally {
    await context.close();
  }
});
