import { expect, test } from './fixtures';

test('activity history shows a real stored entry, from the real options page, and can be cleared', async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  // The message-passing path from a paste-watcher's decision to a stored entry is covered by
  // handle-record-activity's unit tests. This test is about the options page itself: does it
  // correctly read, render, and clear a real entry from chrome.storage.local.
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('networkidle');

  await serviceWorker.evaluate(async () => {
    interface MinimalChrome {
      storage: {
        local: {
          get(key: string): Promise<Record<string, unknown>>;
          set(items: Record<string, unknown>): Promise<void>;
        };
      };
    }
    const chromeApi = (globalThis as unknown as { chrome: MinimalChrome }).chrome;
    const STORAGE_KEY = 'agentfence:state';
    const now = Date.now();
    const existing = (await chromeApi.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
    await chromeApi.storage.local.set({
      [STORAGE_KEY]: {
        ...(existing as object),
        activityHistory: [
          {
            id: 'entry-1',
            timestamp: now,
            sourceContext: { type: 'finance' },
            destinationContext: { type: 'public' },
            sourceDomain: 'bank.demo.test',
            destinationDomain: 'public-form.demo.test',
            decision: 'block',
            outcome: 'blocked',
            ruleId: 'default-finance-to-public',
          },
        ],
      },
    });
  });

  await page.reload();

  const row = page.getByTestId('activity-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Finance → Public');
  await expect(row).toContainText('bank.demo.test → public-form.demo.test');
  await expect(row).toContainText('Blocked');

  await page.getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByText('No activity yet.')).toBeVisible();
  await expect(row).toHaveCount(0);

  await page.reload();
  await expect(page.getByText('No activity yet.')).toBeVisible();
});
