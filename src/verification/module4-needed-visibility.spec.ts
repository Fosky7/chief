import { test, expect } from '@playwright/test';

test('discovery displays Needed @affected', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByText('Needed', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Needed', { exact: true }).first()).toBeVisible();
});
