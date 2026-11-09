import { test, expect } from '@playwright/test';

test.describe('Module 4 step 3 — signed-out dashboard @affected', () => {
  test('signed-out /dashboard shows Dashboard heading and Sign in link @affected', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
  });

  test('signed-out nav shows Sign in and not Sign out @affected', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /sign out/i })).toHaveCount(0);
  });

  test('signed-out /dashboard renders at desktop width without crashing @affected', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: /dashboard/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
