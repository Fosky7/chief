import { test, expect } from '@playwright/test';

test('discovery exposes Needed @affected', async ({ page }) => {
  await page.goto('/discover');
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByText(/\bNeeded\b/).first()).toBeVisible();
});
