import { test, expect } from '@playwright/test';

test('@affected /create-bill shows the Proof of bill field', async ({ page }) => {
  await page.goto('/create-bill');
  await expect(page.getByText('Proof of bill').first()).toBeVisible({ timeout: 15000 });
});
