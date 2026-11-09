import { test, expect, type Page } from "@playwright/test";

/** Reads the visible title of the card currently on top of the swipe deck. */
async function readTopTitle(page: Page): Promise<string> {
  return (await page.getByTestId("swipe-card-title").first().innerText()).trim();
}

/** Drags the top card horizontally by `deltaX` pixels using real pointer input. */
async function dragTopCard(page: Page, deltaX: number): Promise<void> {
  const card = page.getByTestId("swipe-card").first();
  await expect(card).toBeVisible();

  const box = await card.boundingBox();
  expect(box, "the swipe card should be measurable").not.toBeNull();
  const box2 = box as { x: number; y: number; width: number; height: number };

  const startX = box2.x + box2.width / 2;
  const startY = box2.y + box2.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX / 3, startY, { steps: 6 });
  await page.mouse.move(startX + deltaX, startY, { steps: 6 });
  await page.mouse.up();
}

test.describe("Module 4 — /discover swipe deck @affected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("discover-swipe-deck")).toBeVisible();
    await expect(page.getByTestId("swipe-card").first()).toBeVisible();
  });

  test("clicking Skip shows the next bill card with a different title @affected", async ({
    page,
  }) => {
    const firstTitle = await readTopTitle(page);
    expect(firstTitle.length).toBeGreaterThan(0);

    await page.getByTestId("deck-skip").click();

    await expect
      .poll(async () => readTopTitle(page), { timeout: 5000 })
      .not.toBe(firstTitle);

    const secondTitle = await readTopTitle(page);
    expect(secondTitle.length).toBeGreaterThan(0);
    expect(secondTitle).not.toBe(firstTitle);
  });

  test("clicking Give on the deck opens Choose an amount @affected", async ({ page }) => {
    await page.getByTestId("deck-give").click();

    const sheet = page.getByTestId("amount-sheet");
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("heading", { name: "Choose an amount" }),
    ).toBeVisible();
    await expect(sheet.getByTestId("amount-input")).toBeVisible();

    // The typed amount stays visible inside the opened panel.
    await sheet.getByLabel("Amount (₦)").fill("4500");
    await expect(sheet.getByLabel("Amount (₦)")).toHaveValue("4500");
  });

  test("dragging the top card left shows the next bill card @affected", async ({ page }) => {
    const firstTitle = await readTopTitle(page);

    // A drag past the swipe threshold (96px) commits a skip.
    await dragTopCard(page, -220);

    await expect
      .poll(async () => readTopTitle(page), { timeout: 5000 })
      .not.toBe(firstTitle);

    const secondTitle = await readTopTitle(page);
    expect(secondTitle).not.toBe(firstTitle);
  });

  test("clicking the top card's bill title opens that bill's detail page @affected", async ({
    page,
  }) => {
    const title = await readTopTitle(page);
    expect(title.length).toBeGreaterThan(0);

    const titleLink = page.getByTestId("swipe-card-title").first().getByRole("link");
    await expect(titleLink).toBeVisible();
    await expect(titleLink).toHaveText(title);

    await titleLink.click();

    await expect(page).toHaveURL(/\/bills\/[^/?#]+/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
