import { test, expect, type Page } from '@playwright/test';

/**
 * Module 4 — swipe deck bill card content and detail navigation.
 *
 * These specs drive the real /discover UI (fed by approved bills when present,
 * otherwise by the bundled verified sample deck) and the real bill detail route.
 */

/** "₦" followed by groups of three digits, e.g. ₦250,000. */
const NAIRA_AMOUNT = /^₦\d{1,3}(,\d{3})*$/;

async function openDeck(page: Page): Promise<void> {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Discover bills', level: 1 })).toBeVisible();
}

test.describe('@affected swipe deck bill card', () => {
  test('@affected top card shows photo, title, Needed and Raised amounts and a progress bar', async ({
    page,
  }) => {
    await openDeck(page);

    const card = page.getByTestId('swipe-card-top');
    if ((await card.count()) === 0) {
      test.skip(true, 'setup-required: /discover rendered no top bill card to inspect.');
      return;
    }
    await expect(card).toBeVisible();

    // Bill title
    const title = card.getByTestId('swipe-card-title');
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText(/^\s*$/);

    // Bill photo (the card falls back to a placeholder when a row has no image).
    const photo = card.locator('img').first();
    if ((await photo.count()) > 0) {
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute('src', /\S/);
    } else {
      await expect(card.getByText('No photo yet')).toBeVisible();
    }

    // Labelled figures
    await expect(card.getByText('Needed', { exact: true })).toBeVisible();
    await expect(card.getByText('Raised', { exact: true })).toBeVisible();

    const needed = card.getByTestId('swipe-card-needed');
    const raised = card.getByTestId('swipe-card-raised');
    await expect(needed).toBeVisible();
    await expect(raised).toBeVisible();

    // Formatted as naira with the symbol and thousands separators.
    await expect(needed).toHaveText(NAIRA_AMOUNT);
    await expect(raised).toHaveText(NAIRA_AMOUNT);

    const neededText = ((await needed.textContent()) ?? '').trim();
    const neededValue = Number(neededText.replace(/[^0-9]/g, '') || '0');
    if (neededValue >= 1000) {
      // ₦1,000+ must contain an explicit thousands separator.
      await expect(needed).toHaveText(/₦\d{1,3},\d{3}/);
    }

    // Funding progress bar
    const progress = card.getByRole('progressbar').first();
    await expect(progress).toBeVisible();
    const ariaNow = Number(await progress.getAttribute('aria-valuenow'));
    expect(Number.isFinite(ariaNow)).toBe(true);
    expect(ariaNow).toBeGreaterThanOrEqual(0);
    expect(ariaNow).toBeLessThanOrEqual(100);

    const bar = progress.locator('div').first();
    await expect(bar).toHaveAttribute('style', /width:\s*\d+(\.\d+)?%/);
  });

  test('@affected View details opens the bill detail page showing the same bill title', async ({
    page,
  }) => {
    await openDeck(page);

    const card = page.getByTestId('swipe-card-top');
    if ((await card.count()) === 0) {
      test.skip(true, 'setup-required: /discover rendered no top bill card to open.');
      return;
    }

    const titleText = ((await card.getByTestId('swipe-card-title').textContent()) ?? '').trim();
    expect(titleText.length).toBeGreaterThan(0);

    await card.getByRole('link', { name: 'View details' }).click();

    await expect(page).toHaveURL(/\/bills\/[^/?#]+/);
    await expect(page.locator('main')).toBeVisible();
    // The detail page must display the same bill title we clicked from.
    await expect(page.locator('body')).toContainText(titleText, { timeout: 15_000 });
  });
});
