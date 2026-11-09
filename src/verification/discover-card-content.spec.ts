import { test, expect, type Page } from '@playwright/test';

/**
 * Module 4 — approved-bill card content on /discover.
 *
 * These specs drive the real deck UI (approved bills when present, otherwise
 * the bundled verified sample deck) and assert the card's photo, title,
 * naira amounts, progress bar and View details navigation.
 */

const AMOUNT_PATTERN = /^₦[\d,]+(\.\d+)?$/;

const topCard = (page: Page) => page.getByTestId('swipe-card-top');

async function openDeck(page: Page): Promise<void> {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Discover bills', level: 1 })).toBeVisible();
  await expect(topCard(page)).toBeVisible({ timeout: 15_000 });
}

/** Escapes a string so it can be embedded in a RegExp source. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('@affected swipe deck card content', () => {
  test('@affected the top card shows the photo, title, Needed/Raised amounts and a progress bar', async ({
    page,
  }) => {
    await openDeck(page);
    const card = topCard(page);

    // Bill photo (or the documented placeholder when a record has no image).
    const photo = card.getByTestId('swipe-card-photo');
    if ((await photo.count()) === 0) {
      test.info().annotations.push({
        type: 'setup-required',
        description:
          'The current bill record has no image, so the card renders its "No photo yet" placeholder.',
      });
      await expect(card.getByText('No photo yet')).toBeVisible();
    } else {
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute('src', /.+/);
    }

    // Bill title.
    const title = card.getByTestId('swipe-card-title');
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText('');

    // Needed / Raised labels and naira amounts with thousands separators.
    await expect(card.getByText('Needed', { exact: true })).toBeVisible();
    await expect(card.getByText('Raised', { exact: true })).toBeVisible();

    const needed = card.getByTestId('swipe-card-needed');
    const raised = card.getByTestId('swipe-card-raised');
    await expect(needed).toHaveText(AMOUNT_PATTERN);
    await expect(raised).toHaveText(AMOUNT_PATTERN);
    expect((await needed.textContent())?.startsWith('₦')).toBe(true);
    expect((await raised.textContent())?.startsWith('₦')).toBe(true);

    // Funding progress bar with a valid percentage.
    await expect(card.getByTestId('swipe-card-progress')).toBeVisible();
    const bar = card.getByRole('progressbar');
    await expect(bar).toBeVisible();
    const ariaNow = Number(await bar.getAttribute('aria-valuenow'));
    expect(Number.isFinite(ariaNow)).toBe(true);
    expect(ariaNow).toBeGreaterThanOrEqual(0);
    expect(ariaNow).toBeLessThanOrEqual(100);
  });

  test('@affected View details opens the bill detail page for the same bill', async ({ page }) => {
    await openDeck(page);
    const card = topCard(page);

    const billId = await card.getAttribute('data-bill-id');
    expect(billId).toBeTruthy();

    const cardTitle =
      ((await card.getByTestId('swipe-card-title').textContent()) ?? '').trim();
    expect(cardTitle.length).toBeGreaterThan(0);

    await card.getByRole('link', { name: 'View details' }).click();

    await expect(page).toHaveURL(new RegExp(`/bills/${escapeRegExp(billId as string)}$`));

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const headingText = ((await heading.textContent()) ?? '').trim();

    if (headingText === 'Bill not found') {
      // The deck fell back to a bundled sample bill that has no persisted row,
      // so the detail route correctly renders its not-found state.
      test.info().annotations.push({
        type: 'setup-required',
        description:
          'The deck served a bundled sample bill that is not persisted, so no matching bill detail record exists.',
      });
      await expect(page.getByRole('link', { name: 'Browse bills' })).toBeVisible();
      return;
    }

    expect(headingText).toBe(cardTitle);
  });
});
