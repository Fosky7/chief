import { test, expect } from '@playwright/test';

test('admin review queue loads directly for an admin @affected', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, 'setup-required: E2E_USER_EMAIL and E2E_USER_PASSWORD are required to sign in');

  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /bills awaiting review/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('admin-bill-card').first()).toBeVisible({ timeout: 15000 });
});
