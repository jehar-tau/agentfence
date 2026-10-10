import { expect, test } from './fixtures';

test('built extension loads and the popup shows the active status', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByText('AgentFence is active')).toBeVisible();
  await expect(page.getByText("This page can't be assigned a context")).toBeVisible();
});
