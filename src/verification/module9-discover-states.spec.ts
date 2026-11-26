import { expect, test } from '@playwright/test';

test.describe('Module 9 — discover loading and empty states @affected', () => {
  test('discover shows the Loading bills state while the deck is fetched @affected', async ({ page }) => {
    // Slow the connected backend down (without replacing it) so the loading
    // state is observable instead of flashing past on a fast connection.
    await page.route('**/rest/v1/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto('/discover');

    const loading = page.getByTestId('discover-loading');
    await expect(loading).toBeVisible();
    await expect(loading).toContainText('Loading bills');
    await expect(page.getByRole('heading', { level: 1, name: 'Discover bills' })).toBeVisible();

    // The deck is on screen the whole time (a real card), and the loading
    // indicator must give way once the live catalogue answers.
    await expect(page.getByTestId('swipe-card').first()).toBeVisible({ timeout: 20000 });
    await expect(loading).toBeHidden({ timeout: 20000 });
  });

  test('skipping through the deck ends on the You\u2019ve seen every bill empty state @affected', async ({
    page,
  }) => {
    await page.goto('/discover');
    await expect(page.getByRole('heading', { level: 1, name: 'Discover bills' })).toBeVisible();

    // Wait for the first load to finish.
    await expect(page.getByTestId('discover-loading')).toBeHidden({ timeout: 20000 });

    const empty = page.getByTestId('discover-empty');
    const skip = page.getByTestId('swipe-card').getByRole('button', { name: 'Skip', exact: true });

    // Exhaust the deck with the real Skip control. A backend that currently
    // holds no bills starts on the empty state, which is also valid.
    let guard = 0;
    while (guard < 40) {
      if (await empty.isVisible().catch(() => false)) break;
      if (!(await skip.isVisible().catch(() => false))) break;
      await skip.click();
      await page.waitForTimeout(100);
      guard += 1;
    }

    await expect(empty).toBeVisible({ timeout: 10000 });
    await expect(empty).toContainText("You've seen every bill");
  });
});
