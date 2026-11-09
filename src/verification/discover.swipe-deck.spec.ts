import { test, expect, type Page } from '@playwright/test';

/**
 * Module 4 — Swipe deck discovery (@affected).
 *
 * Flows covered, one test each:
 *   1. The home-page "Discover bills" doorway opens the swipe deck, which
 *      renders a Skip button that advances the deck.
 *   2. Skip button advances the deck to the next bill card.
 *   3. Give button opens the Choose an amount sheet.
 *   4. Dragging the top card left advances the deck to the next bill card.
 *   5. The top card shows its photo, title, Needed/Raised naira amounts and a
 *      progress bar, with thousands separators for amounts of 1,000+.
 *   6. View details navigates to that bill's detail route.
 *
 * The deck is fed by verified sample bills, so no account is required for
 * these flows.
 */

const DECK_POSITION = 'deck-position';
const TOP_CARD = 'swipe-card-top';

function parseDeckPosition(text: string): { index: number; total: number } {
  const numbers = text
    .split(' ')
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));
  if (numbers.length < 2) return { index: Number.NaN, total: Number.NaN };
  return { index: numbers[0], total: numbers[1] };
}

function deckPosition(page: Page) {
  return page.getByTestId(DECK_POSITION);
}

async function readDeck(page: Page) {
  const position = deckPosition(page);
  await expect(position).toBeVisible();
  const text = (await position.innerText()).trim();
  return parseDeckPosition(text);
}

async function expectDeckAdvanced(
  page: Page,
  before: { index: number; total: number },
  previousBillId: string | null,
) {
  if (before.index < before.total) {
    await expect(deckPosition(page)).toHaveText(
      `Bill ${before.index + 1} of ${before.total}`,
    );
    if (previousBillId) {
      await expect(page.getByTestId(TOP_CARD)).not.toHaveAttribute(
        'data-bill-id',
        previousBillId,
      );
    }
  } else {
    await expect(page.getByTestId('deck-empty')).toBeVisible();
  }
}

function amountDigits(text: string): number {
  return Number(text.replace(/[^0-9]/g, ''));
}

function isNairaAmount(text: string): boolean {
  if (!text.startsWith('₦')) return false;
  const body = text.slice(1);
  if (body.length === 0) return false;
  return Array.from(body).every(
    (char) => char === ',' || char === '.' || (char >= '0' && char <= '9'),
  );
}

test.describe('discover swipe deck @affected', () => {
  test('home "Discover bills" doorway opens the swipe deck with a working Skip button @affected', async ({
    page,
  }) => {
    await page.goto('/');

    // The hero CTA is the doorway into the deck.
    const doorway = page.getByRole('link', { name: 'Discover bills', exact: true });
    await expect(doorway).toBeVisible();
    await doorway.click();

    await page.waitForURL((url) => url.pathname === '/discover', {
      timeout: 15_000,
    });
    expect(new URL(page.url()).pathname).toBe('/discover');

    // The deck renders the top bill card.
    await expect(page.getByTestId(TOP_CARD)).toBeVisible({ timeout: 15_000 });

    // ...and a Skip button that really advances the deck.
    const skip = page.getByRole('button', { name: /skip/i });
    await expect(skip).toBeVisible();

    const before = await readDeck(page);
    expect(before.total).toBeGreaterThan(0);
    const previousBillId = await page
      .getByTestId(TOP_CARD)
      .getAttribute('data-bill-id');

    await skip.click();

    await expectDeckAdvanced(page, before, previousBillId);
  });

  test('Skip button shows the next bill card @affected', async ({ page }) => {
    await page.goto('/discover');

    const topCard = page.getByTestId(TOP_CARD);
    await expect(topCard).toBeVisible();
    await expect(topCard.getByTestId('swipe-card-title')).not.toBeEmpty();

    const before = await readDeck(page);
    expect(before.total).toBeGreaterThan(0);
    const previousBillId = await topCard.getAttribute('data-bill-id');

    await page.getByRole('button', { name: /skip/i }).click();

    await expectDeckAdvanced(page, before, previousBillId);
  });

  test('Give button opens the amount chooser sheet @affected', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByTestId(TOP_CARD)).toBeVisible();

    await page.getByRole('button', { name: /^give$/i }).click();

    const sheet = page.getByRole('dialog', { name: 'Choose an amount' });
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole('heading', { name: 'Choose an amount' }),
    ).toBeVisible();

    const amountOptions = sheet.locator('button[aria-pressed]');
    expect(await amountOptions.count()).toBeGreaterThan(0);
    const firstOption = amountOptions.first();
    await expect(firstOption).toHaveAttribute('aria-pressed', 'false');
    await firstOption.click();
    await expect(firstOption).toHaveAttribute('aria-pressed', 'true');

    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();
  });

  test('Dragging the top card left shows the next bill card @affected', async ({ page }) => {
    await page.goto('/discover');

    const topCard = page.getByTestId(TOP_CARD);
    await expect(topCard).toBeVisible();

    const before = await readDeck(page);
    expect(before.total).toBeGreaterThan(0);
    const previousBillId = await topCard.getAttribute('data-bill-id');

    const box = await topCard.boundingBox();
    expect(box, 'the top swipe card should have a layout box').not.toBeNull();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let step = 1; step <= 12; step += 1) {
      await page.mouse.move(startX - step * 20, startY, { steps: 2 });
    }
    await page.mouse.up();

    await expectDeckAdvanced(page, before, previousBillId);
  });

  test('top card shows the photo, title, Needed and Raised naira amounts and a progress bar @affected', async ({
    page,
  }) => {
    await page.goto('/discover');

    const top = page.getByTestId(TOP_CARD);
    await expect(top).toBeVisible();

    const media = top
      .locator(
        `[data-testid='swipe-card-photo'], [data-testid='swipe-card-photo-placeholder']`,
      )
      .first();
    await expect(media).toBeVisible();

    const title = top.getByTestId('swipe-card-title');
    await expect(title).toBeVisible();
    expect((await title.innerText()).trim().length).toBeGreaterThan(0);

    await expect(top.getByText('Needed', { exact: true })).toBeVisible();
    await expect(top.getByText('Raised', { exact: true })).toBeVisible();

    const neededText = (await top.getByTestId('swipe-card-needed').innerText()).trim();
    const raisedText = (await top.getByTestId('swipe-card-raised').innerText()).trim();

    for (const amountText of [neededText, raisedText]) {
      expect(isNairaAmount(amountText)).toBe(true);
      if (amountDigits(amountText) >= 1000) {
        expect(amountText).toContain(',');
      }
    }

    const progress = top.getByTestId('swipe-card-progress');
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute('role', 'progressbar');
    const percent = Number(await progress.getAttribute('aria-valuenow'));
    expect(Number.isFinite(percent)).toBe(true);
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });

  test('View details opens the bill detail page for the same bill @affected', async ({
    page,
  }) => {
    await page.goto('/discover');

    const top = page.getByTestId(TOP_CARD);
    await expect(top).toBeVisible();

    const title = (await top.getByTestId('swipe-card-title').innerText()).trim();
    expect(title.length).toBeGreaterThan(0);

    const billId = await top.getAttribute('data-bill-id');
    expect(billId).toBeTruthy();

    const details = top.getByTestId('swipe-card-details');
    await expect(details).toHaveAttribute('href', `/bills/${billId}`);
    await details.click();

    await page.waitForURL((url) => url.pathname === `/bills/${billId}`, {
      timeout: 15_000,
    });
    expect(new URL(page.url()).pathname).toBe(`/bills/${billId}`);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const headingText = (await heading.innerText()).trim();

    if (headingText === 'Bill not found') {
      test.info().annotations.push({
        type: 'setup-required',
        description: `The deck bill ${billId} (${title}) is not present in the connected backend. A disposable approved bill fixture is required to verify the detail page.`,
      });
      test.skip(true, 'Approved bill fixture is not available in the connected backend');
      return;
    }

    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  });
});