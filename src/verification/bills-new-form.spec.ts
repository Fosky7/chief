import { test, expect } from '@playwright/test';

test.describe('Bill submission form /bills/new @affected', () => {
  test('shows all fields, formats naira and validates title @affected', async ({ page }) => {
    await page.goto('/bills/new');
    for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
    await page.getByLabel('Amount (₦)', { exact: true }).fill('250000');
    await expect(page.getByTestId('amount-preview')).toHaveText('₦250,000');
    await page.getByRole('button', { name: /submit bill/i }).click();
    await expect(page.getByText('Title is required')).toBeVisible();
  });

  test('submitting a complete form shows Pending review @affected @database @persistence', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied' });
      test.skip(true, 'Disposable account not supplied');
      return;
    }
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForTimeout(1500);

    await page.goto('/bills/new');
    const title = `E2E disposable bill ${Date.now()}`;
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Story', { exact: true }).fill('Disposable verification bill.');
    await page.getByLabel('Category', { exact: true }).selectOption('Medical');
    await page.getByLabel('Biller name', { exact: true }).fill('Test Hospital');
    await page.getByLabel('Amount (₦)', { exact: true }).fill('250000');
    await page.getByLabel('Due date', { exact: true }).fill('2030-01-15');
    await page.getByLabel('Proof of bill', { exact: true }).setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: /submit bill/i }).click();
    await expect(page.getByRole('heading', { name: 'Pending review' })).toBeVisible({ timeout: 20000 });
  });
});
