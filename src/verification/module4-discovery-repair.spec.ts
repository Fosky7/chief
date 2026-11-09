import { test, expect } from '@playwright/test';

test('@affected discovery is reachable from the home page without runtime errors', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  const discoveryLink = page.locator('a[href="/discover"]').first();
  await expect(discoveryLink).toBeVisible();
  await discoveryLink.click();

  await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(runtimeErrors, 'Discovery navigation must not raise browser runtime errors').toEqual([]);
});
