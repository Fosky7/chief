import { test, expect } from '@playwright/test';

// Preserve the existing Module 4 specifications and authentication fixtures.
// Exercise the real discovery route using the runner's configured baseURL.
test('discovery visibly renders Needed @affected', async ({ page }) => {
  const response = await page.goto('/discover');

  expect(response, 'The discovery route must return a document').not.toBeNull();
  expect(response!.ok(), 'The discovery route must load successfully').toBe(true);
  await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
  await expect(page.getByText(/\bNeeded\b/i).first()).toBeVisible();
});
