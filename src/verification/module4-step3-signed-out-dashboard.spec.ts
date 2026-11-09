import { test, expect } from '@playwright/test';

// Module 4 — steps 2 & 3 verification against the real running app.
// Signed-out flows need no credentials; signed-in flow uses runner-supplied disposable accounts.

test.describe('@affected module4 signed-out dashboard & nav', () => {
  test('signed out /dashboard shows Dashboard heading with Sign in link, or redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (/\/sign-in/.test(url)) {
      await expect(page).toHaveURL(/\/sign-in/);
    } else {
      await expect(page.getByRole('heading', { level: 1, name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    }
  });

  test('signed out nav shows Sign in and no Sign out', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
    await expect(nav.getByRole('button', { name: /sign out/i })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /sign out/i })).toHaveCount(0);
  });

  test('signed in nav shows Dashboard and Sign out; sign out returns to signed-out nav', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not provided' });
      test.skip(true, 'Disposable test account not configured');
      return;
    }
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: /dashboard/i }).first()).toBeVisible({ timeout: 15000 });
    const signOut = nav.getByRole('button', { name: /sign out/i }).or(nav.getByRole('link', { name: /sign out/i })).first();
    await expect(signOut).toBeVisible();
    await signOut.click();
    await expect(page.getByRole('navigation').first().getByRole('link', { name: /sign in/i }).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('@affected module4 bill detail states', () => {
  test('unknown bill id shows not found with link back to discover', async ({ page }) => {
    await page.goto('/bills/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText(/not found/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('a[href*="/discover"]').first()).toBeVisible();
  });
});

test.describe('@affected module4 existing pages still load', () => {
  for (const path of ['/', '/discover', '/sign-in']) {
    test(`page ${path} renders`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});
