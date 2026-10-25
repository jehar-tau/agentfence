import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test';

// Built by `pnpm build:e2e` (run automatically by `pnpm test:e2e-smoke`) — identical to the
// real `dist/chrome` build except for a handful of required host_permissions on the demo
// playground's origins, which lets tests drive real content-script injection without a native
// permission prompt. See wxt.config.ts and docs/decisions.md.
const extensionPath = path.resolve('dist/e2e/chrome');

// A dedicated port, distinct from `pnpm demo`'s default 5300, so running the e2e suite never
// collides with a developer's own manually-started playground.
export const PLAYGROUND_TEST_PORT = 5301;

interface Fixtures {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  /** The demo playground server, started fresh and torn down for any test that asks for it. */
  playgroundServer: { baseUrl: (hostname: string) => string };
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
  serviceWorker: async ({ context }, provide) => {
    const serviceWorker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await provide(serviceWorker);
  },
  extensionId: async ({ serviceWorker }, provide) => {
    await provide(new URL(serviceWorker.url()).host);
  },
  // eslint-disable-next-line no-empty-pattern
  playgroundServer: async ({}, provide) => {
    const server: ChildProcess = spawn('node', ['playground/server.mjs'], {
      cwd: path.resolve('.'),
      env: { ...process.env, PORT: String(PLAYGROUND_TEST_PORT) },
      stdio: 'pipe',
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Playground server did not start in time')),
        10_000,
      );
      server.stdout?.on('data', (chunk: Buffer) => {
        if (chunk.toString().includes('Press Ctrl+C to stop')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      server.once('error', reject);
      server.once('exit', (code) => reject(new Error(`Playground server exited early (${code})`)));
    });

    await provide({
      baseUrl: (hostname: string) => `http://${hostname}.localhost:${PLAYGROUND_TEST_PORT}/`,
    });

    server.kill();
  },
});

export { expect } from '@playwright/test';
