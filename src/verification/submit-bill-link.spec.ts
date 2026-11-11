import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test('@affected clicking Submit a bill from home shows the Proof of bill field', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Submit a bill' }).first().click();
  await expect(page).toHaveURL(/\/bills\/new/);

  const emailField = page.getByLabel(/email/i).first();
  if (await emailField.isVisible().catch(() => false)) {
    if (!email || !password) {
      test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied' });
      test.skip(true, 'Disposable test account not supplied');
    }
    await emailField.fill(email!);
    await page.getByLabel(/password/i).first().fill(password!);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.getByRole('link', { name: 'Submit a bill' }).first().click();
  }

  await expect(page.getByText('Proof of bill').first()).toBeVisible();
});
