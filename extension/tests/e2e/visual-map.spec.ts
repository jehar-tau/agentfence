import { expect, test } from './fixtures';

test('visual map loads from the extension and shows an empty state with no sites protected', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/visual-map.html`);
  await expect(page.getByRole('heading', { name: /Visual Fence Map/ })).toBeVisible();
  await expect(page.getByText('No protected sites yet.')).toBeVisible();
});

test('shows protected sites and lets the user inspect a flow between them', async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('networkidle');

  // Seed site assignments directly (no popup permission flow needed for this test).
  await serviceWorker.evaluate(async () => {
    const STORAGE_KEY = 'agentfence:state';
    const now = Date.now();
    const entry = (pattern: string, context: unknown) => ({
      id: pattern,
      pattern,
      context,
      enabled: true,
      source: 'user',
      createdAt: now,
      updatedAt: now,
    });
    interface MinimalChrome {
      storage: {
        local: {
          get(key: string): Promise<Record<string, unknown>>;
          set(items: Record<string, unknown>): Promise<void>;
        };
      };
    }
    const chromeApi = (globalThis as unknown as { chrome: MinimalChrome }).chrome;
    const existing = (await chromeApi.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
    await chromeApi.storage.local.set({
      [STORAGE_KEY]: {
        ...(existing as object),
        domainContexts: [
          entry('bank.demo.test', { type: 'finance' }),
          entry('work-chat.demo.test', { type: 'work' }),
        ],
      },
    });
  });

  await page.goto(`chrome-extension://${extensionId}/visual-map.html`);
  await expect(page.getByText('bank.demo.test')).toBeVisible();
  await expect(page.getByText('work-chat.demo.test')).toBeVisible();

  await page.getByText('bank.demo.test').click();
  const details = page.getByRole('complementary', { name: 'Site details' });
  await expect(details.getByRole('heading', { name: 'bank.demo.test' })).toBeVisible();
  await expect(details.getByText('Finance', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Blocked only/ }).click();
  await expect(page.getByText('No protected sites yet.')).toHaveCount(0);
});
