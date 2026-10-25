import type { BrowserContext, Worker } from '@playwright/test';
import { PLAYGROUND_TEST_PORT, expect, test } from './fixtures';

/**
 * Closes the gap tracked in https://github.com/jehar-tau/agentfence/issues/20: every other
 * e2e test seeds state directly and never exercises the real per-site permission grant, the
 * real content scripts, or the real clipboard. This spec does, by building the extension with
 * the demo playground's origins as required host_permissions instead of optional (see
 * wxt.config.ts) — a test-only substitute for the native permission prompt Playwright cannot
 * click, not a substitute for the real copy/paste/dialog/activity pipeline, which runs exactly
 * as it does for a real user.
 */

interface MinimalChrome {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
}

/**
 * Visiting any extension page makes it call `loadState()`, which runs the real schema
 * migration and persists a fully-shaped `{ schemaVersion, domainContexts, flowRules,
 * activityHistory }` object. Without this first, writing `domainContexts` directly (below)
 * would write an object with no `schemaVersion` — the next real `loadState()` call (e.g. when
 * the background evaluates a copy or paste) would see version 0 and re-run every migration
 * from scratch, which resets `domainContexts` back to `[]` before setting it again. Same
 * pattern as seeding the screenshots in docs/decisions.md's Milestone 7/10/11 entries.
 */
async function warmUpStorage(context: BrowserContext, extensionId: string): Promise<void> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('networkidle');
  await page.close();
}

/** Assigns contexts directly, the one piece of setup a real user does through the popup UI
 *  rather than the native permission prompt — popup interaction itself isn't this spec's gap. */
async function assignContexts(
  serviceWorker: Worker,
  assignments: Array<[hostname: string, type: string]>,
): Promise<void> {
  await serviceWorker.evaluate(async (pairs) => {
    const chromeApi = (globalThis as unknown as { chrome: MinimalChrome }).chrome;
    const STORAGE_KEY = 'agentfence:state';
    const now = Date.now();
    const existing = (await chromeApi.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
    const domainContexts = pairs.map(([pattern, type]) => ({
      id: pattern,
      pattern,
      context: { type },
      enabled: true,
      source: 'user',
      createdAt: now,
      updatedAt: now,
    }));
    await chromeApi.storage.local.set({
      [STORAGE_KEY]: { ...(existing as object), domainContexts },
    });
  }, assignments);
}

test.beforeEach(async ({ context }) => {
  // Real copy/paste needs a real clipboard. Playwright supports this directly; it has nothing
  // to do with the extension's own permission (the actual gap this spec closes).
  for (const hostname of ['bank', 'work-chat', 'client-b']) {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: `http://${hostname}.localhost:${PLAYGROUND_TEST_PORT}`,
    });
  }
});

test('blocks a real Finance → Work paste, from a real copy through the real in-page dialog', async ({
  context,
  serviceWorker,
  extensionId,
  playgroundServer,
}) => {
  await warmUpStorage(context, extensionId);
  await assignContexts(serviceWorker, [
    ['bank.localhost', 'finance'],
    ['work-chat.localhost', 'work'],
  ]);

  const bank = await context.newPage();
  await bank.goto(playgroundServer.baseUrl('bank'));

  // A real DOM selection and a real Ctrl/Cmd+C — the page's native `copy` event, observed by
  // the real copy-watcher.js content script (registered because bank.localhost is a required
  // permission in this test build; see wxt.config.ts).
  await bank.getByText('₹8,42,520').click({ clickCount: 3 });
  await bank.keyboard.press('ControlOrMeta+C');

  const workChat = await context.newPage();
  await workChat.goto(playgroundServer.baseUrl('work-chat'));
  const composer = workChat.locator('.composer');
  await composer.click();
  await workChat.keyboard.press('ControlOrMeta+V');

  // The real intervention dialog (Shadow DOM) — Playwright locators pierce an open shadow root.
  await expect(workChat.getByRole('heading', { name: 'Context crossing' })).toBeVisible();
  await expect(workChat.getByText('Finance → Work', { exact: true })).toBeVisible();
  await expect(workChat.getByText(/Copied from bank\.localhost/)).toBeVisible();

  await workChat.getByRole('button', { name: 'Block' }).click();

  // Prevented, not just "the dialog said Block" — the balance never lands in the field.
  await expect(composer).not.toContainText('8,42,520');
});

test('completes a real same-context paste seamlessly, with no dialog', async ({
  context,
  serviceWorker,
  extensionId,
  playgroundServer,
}) => {
  // Assign client-b and work-chat the same context for this test, so the real paste should go
  // through silently — proving the allow path end to end, not just the ask/block path.
  await warmUpStorage(context, extensionId);
  await assignContexts(serviceWorker, [
    ['client-b.localhost', 'work'],
    ['work-chat.localhost', 'work'],
  ]);

  const clientB = await context.newPage();
  await clientB.goto(playgroundServer.baseUrl('client-b'));
  await clientB.getByText('Globex Demo Corp', { exact: true }).click({ clickCount: 3 });
  await clientB.keyboard.press('ControlOrMeta+C');

  const workChat = await context.newPage();
  await workChat.goto(playgroundServer.baseUrl('work-chat'));
  const composer = workChat.locator('.composer');
  await composer.click();
  await workChat.keyboard.press('ControlOrMeta+V');

  await expect(composer).toContainText('Globex Demo Corp');
  await expect(workChat.getByRole('heading', { name: 'Context crossing' })).toHaveCount(0);
});
