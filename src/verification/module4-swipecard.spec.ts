import { expect, test, type Page } from "@playwright/test";

async function openDeck(page: Page) {
  await page.goto("/discover");
  const card = page.getByTestId("swipe-card").first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  // Let the live/sample source settle so the deck doesn't reset mid-test.
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await expect(page.getByTestId("deck-counter")).toHaveText(/^1 \/ \d+$/);
  return card;
}

async function deckTotal(page: Page): Promise<number> {
  const text = (await page.getByTestId("deck-counter").textContent()) ?? "";
  return Number(text.split("/")[1]?.trim() ?? "0");
}

test.describe("Module 4 — swipe card @affected", () => {
  test("top card shows photo, title, Needed/Raised and progress bar beneath Raised @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    await expect(card.getByRole("img").first()).toBeVisible();
    const title = card.getByRole("heading", { level: 2 });
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText("");

    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(card.getByTestId("card-needed")).toHaveText(/^₦/);
    await expect(card.getByTestId("card-raised")).toHaveText(/^₦/);

    const raised = card.getByTestId("card-raised");
    const bar = card.getByRole("progressbar");
    await expect(bar).toBeVisible();
    const raisedBox = await raised.boundingBox();
    const barBox = await bar.boundingBox();
    expect(raisedBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    expect(barBox!.y).toBeGreaterThanOrEqual(raisedBox!.y + raisedBox!.height - 1);
  });

  test("Skip shows the next bill card with a different title @affected", async ({ page }) => {
    const card = await openDeck(page);
    const firstTitle = ((await card.getByRole("heading", { level: 2 }).textContent()) ?? "").trim();
    expect(firstTitle).not.toBe("");
    const total = await deckTotal(page);

    await card.getByRole("button", { name: "Skip", exact: true }).click();

    if (total > 1) {
      await expect(page.getByTestId("deck-counter")).toHaveText(/^2 \/ \d+$/);
      const next = page.getByTestId("swipe-card").first().getByRole("heading", { level: 2 });
      await expect(next).toBeVisible();
      await expect(next).not.toHaveText(firstTitle);
    } else {
      await expect(page.getByTestId("deck-end")).toBeVisible();
    }
  });

  test("Give opens the Choose an amount sheet @affected", async ({ page }) => {
    const card = await openDeck(page);
    await card.getByRole("button", { name: "Give", exact: true }).click();

    const sheet = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "₦5,000", exact: true })).toBeVisible();

    await sheet.getByRole("button", { name: "₦5,000", exact: true }).click();
    await expect(sheet.getByRole("button", { name: /₦5,000$/ }).last()).toBeEnabled();

    await sheet.getByRole("button", { name: "Not now" }).click();
    await expect(page.getByRole("dialog", { name: "Choose an amount" })).toHaveCount(0);
    await expect(page.getByTestId("deck-counter")).toHaveText(/^1 \/ \d+$/);
  });

  test("dragging the top card left shows the next bill card @affected", async ({ page }) => {
    const card = await openDeck(page);
    const firstTitle = ((await card.getByRole("heading", { level: 2 }).textContent()) ?? "").trim();
    const total = await deckTotal(page);

    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    // Grab the photo area (not a button) and drag left past the threshold.
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + Math.min(80, box!.height / 4);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 100, startY, { steps: 5 });
    await page.mouse.move(startX - 250, startY, { steps: 10 });
    await page.mouse.up();

    if (total > 1) {
      await expect(page.getByTestId("deck-counter")).toHaveText(/^2 \/ \d+$/);
      const next = page.getByTestId("swipe-card").first().getByRole("heading", { level: 2 });
      await expect(next).toBeVisible();
      await expect(next).not.toHaveText(firstTitle);
    } else {
      await expect(page.getByTestId("deck-end")).toBeVisible();
    }
  });
});
