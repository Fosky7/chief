import { expect, test } from '@playwright/test';

const naira = /₦\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/;

test('@affected Discover visibly labels the Needed and Raised amounts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start swiping', exact: true }).click();
  await expect(page).toHaveURL(/\/discover\/?$/);

  const card = page.getByTestId('swipe-card');
  await expect(card).toBeVisible();
  await expect(card.getByText('Needed', { exact: true })).toBeVisible();
  await expect(card.getByTestId('swipe-card-goal')).toHaveText(
    /^Needed ₦\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$/,
  );
  await expect(card.getByTestId('swipe-card-raised')).toBeVisible();
  await expect(card.getByTestId('swipe-card-raised')).toHaveText(
    /^Raised ₦\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$/,
  );
  await expect(card.getByRole('heading', { level: 2 })).not.toBeEmpty();
  const photo = card.getByRole('img');
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute('src', /^https:\/\//);
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(card.getByRole('progressbar', { name: 'Funding progress' })).toBeVisible();
});

test('@affected Skip advances the bill and Give opens Choose an amount', async ({ page }) => {
  await page.goto('/discover');
  const title = page.getByTestId('swipe-card-title');
  await expect(title).toBeVisible();
  await expect(page.getByText('Loading bills…', { exact: true })).toHaveCount(0);
  // Wait for the real endpoint to settle before comparing deck items.
  await page.waitForLoadState('networkidle');
  const first = await title.textContent();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  const end = page.getByTestId('deck-end');
  await expect(async () => {
    if (await end.isVisible()) return;
    await expect(title).not.toHaveText(first!);
  }).toPass();
  if (await end.isVisible()) await page.getByRole('button', { name: 'Start over', exact: true }).click();
  const selected = await title.textContent();
  await page.getByRole('button', { name: 'Give', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose an amount' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(selected!, { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: naira }).first().click();
  await expect(dialog.getByLabel('Amount (₦)')).toHaveValue('1000');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(title).toHaveText(selected!);
});

test('@affected dragging the card left advances the deck', async ({ page }) => {
  await page.goto('/discover');
  const card = page.getByTestId('swipe-card');
  await expect(card).toBeVisible();
  await page.waitForLoadState('networkidle');
  const before = await page.getByTestId('deck-counter').textContent();
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.8, box!.y + 30);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.8 - 160, box!.y + 30, { steps: 12 });
  await page.mouse.up();
  await expect(async () => {
    if (await page.getByTestId('deck-end').isVisible()) return;
    await expect(page.getByTestId('deck-counter')).not.toHaveText(before!);
  }).toPass();
});
