import path from 'node:path';
import { test as base, chromium, type BrowserContext } from '@playwright/test';

const extensionPath = path.resolve('dist/chrome');

interface Fixtures {
  context: BrowserContext;
  extensionId: string;
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, provide) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await provide(context);
    await context.close();
  },
  extensionId: async ({ context }, provide) => {
    const serviceWorker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await provide(new URL(serviceWorker.url()).host);
  },
});

export { expect } from '@playwright/test';
