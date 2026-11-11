import { test, expect } from '@playwright/test';

test('@affected bill submission page exposes the Proof of bill upload backed by bill-proofs storage', async ({ page }) => {
  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill').first()).toBeVisible();
  await expect(page.locator('input[type="file"]').first()).toBeAttached();
});
