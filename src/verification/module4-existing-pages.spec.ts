import { test, expect } from '@playwright/test';

// @affected — regression check that pre-existing pages still render after the Module 4 build.

for (const path of ['/', '/auth', '/sign-in']) {
  test(`@affected ${path} still renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('nav, header').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('@affected /discover renders at least one bill card', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/discover');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(page.getByRole('button').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('@affected /dashboard signed out shows heading and sign-in link', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1, name: /dashboard/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
});
