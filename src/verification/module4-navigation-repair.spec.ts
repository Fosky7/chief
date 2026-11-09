import { test, expect } from '@playwright/test';

test('home discovery navigation survives a full reload @affected', async ({ page }) => {
  await page.goto('/');

  const discoveryLink = page.locator('a[href="/discover"]').first();
  await expect(discoveryLink).toBeVisible();
  await discoveryLink.click();
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByRole('main')).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByRole('main')).toBeVisible();
});
