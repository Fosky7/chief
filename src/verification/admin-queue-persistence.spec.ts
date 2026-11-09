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

test('@affected @database @persistence admin approval persists after reload', async ({ page }) => {
  test.skip(!email || !password, 'setup-required: E2E_USER_EMAIL and E2E_USER_PASSWORD are not configured');

  await signIn(page);
  await page.goto('/admin');

  if (await page.getByText('Admins only', { exact: true }).isVisible().catch(() => false)) {
    test.skip(true, 'setup-required: the disposable E2E_USER_EMAIL account does not have the admin role');
  }

  const pendingCard = page.locator('article').filter({ hasText: 'Pending review' }).first();
  await expect(pendingCard).toBeVisible();
  const title = await pendingCard.getByRole('heading').first().innerText();

  await pendingCard.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Bill approved')).toBeVisible();

  await page.reload();
  await expect(page.locator('article').filter({ hasText: title }).first()).toContainText('Approved');
});
