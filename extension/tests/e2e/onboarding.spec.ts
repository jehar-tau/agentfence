import { expect, test } from './fixtures';

test('onboarding opens automatically on first install', async ({ context }) => {
  // The context fixture already loaded the extension, which fires onInstalled with
  // reason "install" exactly once — the real trigger used in background.ts.
  const onboarding =
    context.pages().find((page) => page.url().endsWith('/onboarding.html')) ??
    (await context.waitForEvent('page'));

  await expect(onboarding.getByRole('heading', { name: /Welcome to AgentFence/ })).toBeVisible();
  await expect(onboarding.getByText('1. Context boundaries')).toBeVisible();
  await expect(onboarding.getByText('5. Try it')).toBeVisible();
});

test('visual map stub loads from the extension', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/visual-map.html`);
  await expect(page.getByRole('heading', { name: /Visual Fence Map/ })).toBeVisible();
  await expect(page.getByText('Not built yet')).toBeVisible();
});
