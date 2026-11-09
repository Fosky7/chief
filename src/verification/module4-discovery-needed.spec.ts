import { test, expect } from '@playwright/test';

// Supplemental regression coverage; preserve the existing discovery specifications.
test('discovery displays the Needed label @affected', async ({ page }) => {
  await page.goto('/discover');

  await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
  await expect(page.getByText('Needed', { exact: true }).first()).toBeVisible();
});
