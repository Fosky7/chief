import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

async function firstBillHref(page: Page): Promise<string | null> {
  await page.goto('/discover');
  const link = page.locator('a[href*="/bills/"]').first();
  try {
    await link.waitFor({ state: 'attached', timeout: 8000 });
  } catch {
    return null;
  }
  return link.getAttribute('href');
}

test.describe('Module 4 remaining steps @affected', () => {
  test('signed-out /dashboard shows heading, sign-in link and nav auth state @affected', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByText('Sign in')).toBeVisible();
    await expect(nav.getByText('Sign out')).toHaveCount(0);
  });

  test('signed-in /dashboard renders without errors @affected', async ({ page }) => {
    if (!EMAIL || !PASSWORD) {
      test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not provided' });
      test.skip(true, 'Disposable test account not configured');
      return;
    }
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Sign in' }).first().click();
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('navigation').first().getByText('Sign out')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('/discover renders at least one bill card @affected', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByText('Needed').first()).toBeVisible();
  });

  test('/bills/$id shows funding progress and donate dialog @affected', async ({ page }) => {
    const href = await firstBillHref(page);
    if (!href) {
      test.info().annotations.push({ type: 'setup-required', description: 'No bill link found on /discover to open a bill detail page' });
      test.skip(true, 'No bill link available');
      return;
    }
    await page.goto(href);
    const funding = page.getByRole('region', { name: 'Funding progress' });
    await expect(funding).toBeVisible();
    await expect(funding).toContainText('₦420,000');
    const donate = page.getByRole('button', { name: 'Donate' });
    if (await donate.isEnabled()) {
      await donate.click();
      await expect(page.getByText('Choose an amount')).toBeVisible();
    }
  });

  test('/bills/unknown id shows not-found message @affected', async ({ page }) => {
    await page.goto('/bills/does-not-exist-krosscheck');
    await expect(page.getByText(/not found/i).first()).toBeVisible();
  });

  test('pending bill shows Pending review and disabled Donate @affected', async ({ page }) => {
    await page.goto('/discover');
    const links = await page.locator('a[href*="/bills/"]').evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[],
    );
    for (const href of Array.from(new Set(links))) {
      await page.goto(href);
      if (await page.getByText('Pending review').count()) {
        await expect(page.getByText('Pending review').first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Donate' })).toBeDisabled();
        return;
      }
    }
    test.info().annotations.push({ type: 'setup-required', description: 'No pending bill reachable from /discover' });
    test.skip(true, 'No pending bill available');
  });
});
