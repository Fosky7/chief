import { test, expect, type Page } from '@playwright/test';

async function openBillsNew(page: Page) {
  await page.goto('/bills/new');
  const proof = page.getByText('Proof of bill').first();
  const password = page.locator('input[type="password"]').first();
  await Promise.race([
    proof.waitFor({ timeout: 10000 }).catch(() => {}),
    password.waitFor({ timeout: 10000 }).catch(() => {}),
  ]);
  if (!(await proof.isVisible().catch(() => false)) && (await password.isVisible().catch(() => false))) {
    const email = process.env.E2E_USER_EMAIL;
    const pass = process.env.E2E_USER_PASSWORD;
    if (!email || !pass) {
      test.info().annotations.push({ type: 'setup-required', description: 'Disposable account E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied' });
      test.skip(true, 'Sign-in required but no disposable account supplied');
    }
    await page.locator('input[type="email"]').first().fill(email!);
    await password.fill(pass!);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await page.goto('/bills/new');
  }
  await expect(page.getByText('Proof of bill').first()).toBeVisible();
}

test('@affected /bills/new shows fields, formats naira and validates title', async ({ page }) => {
  await openBillsNew(page);
  for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
    await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
  }
  const amount = page.getByLabel('Amount (₦)').first();
  await amount.fill('250000');
  await expect(page.getByText('₦250,000').first().or(amount)).toBeVisible();
  const value = await amount.inputValue();
  const shown = value.includes('250,000') || (await page.getByText('₦250,000').count()) > 0;
  expect(shown).toBeTruthy();

  await page.locator('form button[type="submit"]').first().click();
  await expect(page.getByText('Title is required').first()).toBeVisible();
});
