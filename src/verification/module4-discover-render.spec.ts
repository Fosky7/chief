import { test, expect } from '@playwright/test';

// @affected — Module 4 swipe deck discovery: the discover deck (backed by
// approved bills with sample-bill fallback) and its neighbouring pages must
// render without crashing after the Module 4 repair.

const pages = ['/', '/discover', '/dashboard', '/auth'];

for (const path of pages) {
  test(`@affected ${path} renders without uncaught errors`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status() ?? 200).toBeLessThan(400);
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);
  });
}

test('@affected discover deck shows a bill card, empty state or sign-in prompt', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/discover');
  await page.waitForLoadState('networkidle');

  // The deck must render meaningful content (a bill with a naira amount,
  // an empty-state message, or an auth prompt) rather than a blank screen.
  const main = page.locator('body');
  await expect(main).toContainText(/₦|bill|sign in|no more|discover/i);
  expect(pageErrors).toEqual([]);
});
