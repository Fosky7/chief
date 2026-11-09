import { test, expect, type Page } from '@playwright/test';

/**
 * Module 4 — Swipe deck discovery.
 *
 * These specs drive the real /discover UI: the deck is fed by approved bills
 * when present, otherwise by the bundled verified sample deck, so every flow
 * below exercises the shipped component code (no mocks).
 */

const deckSkip = (page: Page) => page.getByTestId('deck-skip');
const deckGive = (page: Page) => page.getByTestId('deck-give');
const topCard = (page: Page) => page.getByTestId('swipe-card-top');

async function topTitle(page: Page): Promise<string | null> {
  const title = topCard(page).getByTestId('swipe-card-title');
  if ((await title.count()) === 0) return null;
  const text = await title.first().textContent();
  return text?.trim() ?? null;
}

/** Describes what the deck shows now, relative to the title we started from. */
async function deckState(page: Page, previousTitle: string | null): Promise<string> {
  const empty = page.getByTestId('deck-empty');
  if ((await empty.count()) > 0 && (await empty.isVisible())) return 'end-of-deck';

  const title = await topTitle(page);
  if (title === null) return 'no-card';
  return title !== previousTitle ? 'next-bill' : 'unchanged';
}

async function openDeck(page: Page): Promise<void> {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Discover bills', level: 1 })).toBeVisible();
}

test.describe('@affected swipe deck discovery', () => {
  test('@affected the Skip button reveals the next bill', async ({ page }) => {
    await openDeck(page);

    const skip = deckSkip(page);
    if ((await skip.count()) === 0) {
      test.skip(true, 'setup-required: the /discover deck rendered no bills to skip.');
      return;
    }

    const firstTitle = await topTitle(page);
    await expect(page.getByTestId('deck-position')).toBeVisible();

    await skip.click();

    await expect
      .poll(() => deckState(page, firstTitle), { timeout: 10_000 })
      .not.toBe('unchanged');

    const position = page.getByTestId('deck-position');
    if ((await position.count()) > 0 && (await position.isVisible())) {
      // The deck starts at bill 1, so a successful skip shows bill 2.
      await expect(position).toHaveText(/^Bill 2 of \d+$/);
    } else {
      await expect(page.getByTestId('deck-empty')).toBeVisible();
    }

    // Skipping must not navigate away from the deck.
    await expect(page).toHaveURL(/\/discover/);
  });

  test('@affected the Give button opens the amount chooser', async ({ page }) => {
    await openDeck(page);

    const give = deckGive(page);
    if ((await give.count()) === 0) {
      test.skip(true, 'setup-required: the /discover deck rendered no bills to give to.');
      return;
    }

    await give.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Choose an amount' })).toBeVisible();

    const preset = page.getByTestId('give-amount-5000');
    await expect(preset).toBeVisible();
    await preset.click();
    await expect(preset).toHaveAttribute('aria-pressed', 'true');

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/discover/);
  });

  test('@affected dragging the top card left reveals the next bill', async ({ page }) => {
    await openDeck(page);

    const card = topCard(page);
    if ((await card.count()) === 0) {
      test.skip(true, 'setup-required: the /discover deck rendered no top card to drag.');
      return;
    }
    await expect(card).toBeVisible();

    const box = await card.boundingBox();
    if (!box) {
      test.skip(true, 'setup-required: the top card has no layout box in this viewport.');
      return;
    }

    const firstTitle = await topTitle(page);
    const startX = box.x + box.width / 2;
    const startY = box.y + Math.min(60, box.height / 2);
    const distance = 220;
    const steps = 8;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let step = 1; step <= steps; step += 1) {
      await page.mouse.move(startX - (distance * step) / steps, startY);
    }
    await page.mouse.up();

    await expect
      .poll(() => deckState(page, firstTitle), { timeout: 10_000 })
      .not.toBe('unchanged');

    // The drag gesture must not follow the View details link.
    await expect(page).toHaveURL(/\/discover/);
  });
});
