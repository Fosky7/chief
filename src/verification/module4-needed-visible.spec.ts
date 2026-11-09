import { test, expect } from '@playwright/test';

test('discovery displays Needed after navigation and reload @affected', async ({ page }) => {
  await page.goto('/discover');
  await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
  await expect(page.getByText(/^Needed\s*:?$/i).first()).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
  await expect(page.getByText(/^Needed\s*:?$/i).first()).toBeVisible();
});
