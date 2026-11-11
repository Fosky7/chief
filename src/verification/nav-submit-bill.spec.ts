import { test, expect } from '@playwright/test';

test('@affected home page "Submit a bill" opens the bill form with Proof of bill', async ({ page }) => {
  await page.goto('/');
  const main = page.getByRole('navigation', { name: 'Main' });
  const link = (await main.count())
    ? main.getByRole('link', { name: 'Submit a bill' })
    : page.getByRole('link', { name: 'Submit a bill' }).first();
  await link.first().click();
  await expect(page).toHaveURL(/\/bills\/new/);
  await expect(page.getByText('Proof of bill').first()).toBeVisible();
});
