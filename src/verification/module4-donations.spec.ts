import { test, expect } from '@playwright/test';

test('discover page shows donation progress @affected', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, 'setup-required: E2E_USER_EMAIL and E2E_USER_PASSWORD are required to sign in');

  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  await page.goto('/discover');
  await expect(page.getByText(/raised/i).first()).toBeVisible({ timeout: 15000 });
});
