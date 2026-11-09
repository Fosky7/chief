import { test, expect } from '@playwright/test';

test('@affected discovery visibly labels the funding still needed', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByText(/\bNeeded\b/).first()).toBeVisible();
});
