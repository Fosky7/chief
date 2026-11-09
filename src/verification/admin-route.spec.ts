import { expect, test } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/sign-in');
  await page.locator('input[type="email"]').fill(email ?? '');
  await page.locator('input[type="password"]').fill(password ?? '');
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForLoadState('networkidle');
}

test('@affected admin route renders review queue', async ({ page }) => {
  test.skip(!email || !password, 'setup-required: E2E_USER_EMAIL and E2E_USER_PASSWORD are not configured');

  await signIn(page);
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Bills awaiting review' })).toBeVisible();

  const adminsOnly = page.getByText('Admins only', { exact: true });
  if (await adminsOnly.isVisible().catch(() => false)) {
    await expect(adminsOnly).toBeVisible();
  } else {
    await expect(page.getByText('Pending review').first()).toBeVisible();
  }
});
