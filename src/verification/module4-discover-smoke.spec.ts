import { test, expect } from '@playwright/test';

// @affected — Module 4 swipe deck discovery: smoke checks that the discover deck,
// home, auth and dashboard routes still render without crashing after the
// sampleBills / currency / SwipeCard repairs.

const routes = ['/', '/auth', '/discover', '/dashboard'];

for (const route of routes) {
  test(`@affected ${route} renders without page errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(route);
    expect(response?.status() ?? 200).toBeLessThan(500);

    await page.waitForLoadState('networkidle');
    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(0);
    expect(errors, `Uncaught errors on ${route}: ${errors.join(' | ')}`).toEqual([]);
  });
}

test('@affected discover deck shows naira-formatted amounts or an empty state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/discover');
  await page.waitForLoadState('networkidle');

  const body = page.locator('body');
  const text = await body.innerText();
  // Either the deck renders bill cards with ₦ amounts, or the page asks the user
  // to sign in / shows an empty deck message. A blank screen is a failure.
  const hasNaira = text.includes('₦');
  const hasFallback = /sign in|no (more )?bills|all caught up|empty|log in/i.test(text);
  expect(hasNaira || hasFallback).toBe(true);
  expect(errors).toEqual([]);
});
