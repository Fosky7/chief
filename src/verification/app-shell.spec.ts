import { test, expect } from '@playwright/test';

test('@affected home page renders inside the root layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('main, nav, header').first()).toBeVisible();
  const text = (await page.locator('body').innerText()).trim();
  expect(text.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
