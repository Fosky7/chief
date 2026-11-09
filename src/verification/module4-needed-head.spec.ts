import { test, expect } from '@playwright/test';

test('route head follows Discover navigation and reload @affected', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pay a bill with a swipe' })).toBeVisible();
  await expect(page).toHaveTitle('Chief — Pay a bill with a swipe');

  await page.getByRole('link', { name: 'Start swiping', exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Discover bills' })).toBeVisible();
  await expect(page).toHaveTitle('Discover bills');
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    'Swipe through approved bills and support the ones that matter to you.',
  );

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Discover bills' })).toBeVisible();
  await expect(page).toHaveTitle('Discover bills');

  await page.getByRole('link', { name: 'Chief home', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Pay a bill with a swipe' })).toBeVisible();
  await expect(page).toHaveTitle('Chief — Pay a bill with a swipe');
});
