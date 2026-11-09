import { test, expect } from '@playwright/test';

test('discovery displays Needed after loading and reloading @affected', async ({ page }) => {
  await page.goto('/discover');
  const needed = page.getByText(/^Needed\b/i).first();
  await expect(needed).toBeVisible();

  await page.reload();
  await expect(needed).toBeVisible();
});
