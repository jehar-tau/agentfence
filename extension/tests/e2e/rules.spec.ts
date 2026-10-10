import { expect, test } from './fixtures';

test('rules page shows defaults, and edits persist in chrome.storage.local', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);

  const rows = page.getByTestId('rule-row');
  await expect(rows).toHaveCount(11);

  const financeToWork = page.getByLabel('Decision for Finance → Work');
  await expect(financeToWork).toHaveValue('ask');
  await financeToWork.selectOption('allow');

  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByTestId('check-result')).toContainText('Allow.');

  await page.reload();
  await expect(page.getByLabel('Decision for Finance → Work')).toHaveValue('allow');

  await page.getByRole('button', { name: 'Reset rules to defaults' }).click();
  await expect(page.getByLabel('Decision for Finance → Work')).toHaveValue('ask');
  await page.reload();
  await expect(page.getByLabel('Decision for Finance → Work')).toHaveValue('ask');
  await expect(rows).toHaveCount(11);
});
