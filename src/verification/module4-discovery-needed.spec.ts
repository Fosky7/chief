import { test, expect } from '@playwright/test';

 test('discovery displays the Needed funding label @affected', async ({ page }) => {
  await page.goto('/discover');
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByText('Needed', { exact: true }).first()).toBeVisible();
});
