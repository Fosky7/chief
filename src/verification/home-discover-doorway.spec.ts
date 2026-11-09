import { test, expect, type Page } from '@playwright/test';

/**
 * Module 4 step 4 — the home page doorway into the swipe deck.
 *
 * Flow under test: on `/`, clicking "Discover bills" navigates to the real
 * /discover deck, which renders its Skip control.
 *
 * The deck itself (skip / give / drag-left / card content) is already covered
 * by the dedicated /discover specs, so this file only exercises the doorway.
 */

async function openHome(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: /pay a bill with a swipe/i, level: 1 }),
  ).toBeVisible();
}

test.describe('@affected home page discover doorway', () => {
  test('@affected clicking "Discover bills" on / opens the swipe deck with a Skip button', async ({
    page,
  }) => {
    await openHome(page);

    // The home-page CTA reads exactly "Discover bills" (it is rendered as a
    // router link by the shared GradientButton, so locate it by accessible
    // text and click it like a real visitor would).
    const cta = page.getByText('Discover bills', { exact: true }).first();
    await expect(cta).toBeVisible();
    await cta.click();

    // Navigation actually happened in the SPA router.
    await expect(page).toHaveURL(/\/discover(?:[?#]|$)/);

    // The deck page rendered, not an error boundary.
    await expect(
      page.getByRole('heading', { name: 'Discover bills', level: 1 }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('region', { name: 'Bill deck' })).toBeVisible();

    // The deck exposes its Skip control.
    const skip = page.getByTestId('deck-skip');
    await expect(skip).toBeVisible({ timeout: 15_000 });
    await expect(skip).toHaveText(/Skip/);
    await expect(skip).toBeEnabled();
  });
});
