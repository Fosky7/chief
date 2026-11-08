import { test, expect, type Page } from '@playwright/test';

// Module 4 — Swipe deck discovery (@affected)
// These checks use the real UI at the configured baseURL. Selectors are
// written against visible text and roles, so they test what users actually see.

const NAIRA = /₦\s?[\d,]+/;

async function openDiscover(page: Page) {
  await page.goto('/discover');
  await page.waitForLoadState('networkidle');
}

async function isEmptyState(page: Page) {
  const dashLink = page.locator('a[href="/dashboard"]');
  const emptyText = page.getByText(/no (more )?(approved )?bills|all caught up|you'?ve seen/i);
  return (await emptyText.count()) > 0 && (await dashLink.count()) > 0;
}

function skipButton(page: Page) {
  return page.getByRole('button', { name: /skip|pass|not now|left/i }).first();
}

function donateButton(page: Page) {
  return page.getByRole('button', { name: /donate|support|fund|right/i }).first();
}

test.describe('Module 4 discover deck @affected', () => {
  test('discover shows bill cards with amounts or an empty state linking to dashboard @affected', async ({ page }) => {
    await openDiscover(page);
    if (await isEmptyState(page)) {
      await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible();
      return;
    }
    // A card must show a currency-formatted amount and a heading/title.
    await expect(page.getByText(NAIRA).first()).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('skipping a bill advances the deck without signing in @affected', async ({ page }) => {
    await openDiscover(page);
    test.skip(await isEmptyState(page), 'No approved bills available to skip');
    const headings = page.getByRole('heading');
    const before = (await headings.allInnerTexts()).join('|');
    await skipButton(page).click();
    await page.waitForTimeout(600);
    // Skip must not redirect to auth.
    await expect(page).toHaveURL(/\/discover/);
    const after = (await headings.allInnerTexts()).join('|');
    const empty = await isEmptyState(page);
    expect(empty || after !== before).toBeTruthy();
  });

  test('signed-out donate redirects to sign in @affected', async ({ page }) => {
    await openDiscover(page);
    test.skip(await isEmptyState(page), 'No approved bills available to donate to');
    await donateButton(page).click();
    await expect(page).toHaveURL(/\/(sign-?in|auth)/, { timeout: 10000 });
  });

  test('signed-in donate advances to the next card @affected', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: 'setup-required',
        description: 'E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account not provided',
      });
      test.skip(true, 'Disposable test account not configured');
      return;
    }
    await page.goto('/auth');
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole('button', { name: /sign in|log in|continue/i }).first().click();
    await page.waitForURL((url) => !/\/auth/.test(url.pathname), { timeout: 15000 });

    await openDiscover(page);
    test.skip(await isEmptyState(page), 'No approved bills available to donate to');
    const headings = page.getByRole('heading');
    const before = (await headings.allInnerTexts()).join('|');
    await donateButton(page).click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/discover/);
    const after = (await headings.allInnerTexts()).join('|');
    const empty = await isEmptyState(page);
    expect(empty || after !== before).toBeTruthy();
  });

  test('existing pages still load @affected', async ({ page }) => {
    for (const path of ['/', '/auth', '/dashboard']) {
      const res = await page.goto(path);
      expect(res?.status() ?? 200).toBeLessThan(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
