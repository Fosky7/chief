import { test, expect } from "@playwright/test";

test.describe("Module 4 step 2 — swipe card @affected", () => {
  test("top card shows photo, title, Needed/Raised and progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByTestId("swipe-card-photo")).toBeVisible();
    await expect(card.getByTestId("swipe-card-title")).not.toBeEmpty();
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(card.getByRole("progressbar")).toBeVisible();
  });

  test("Raised and Needed amounts use naira with thousands separators @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByTestId("swipe-card-raised")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
    await expect(card.getByTestId("swipe-card-needed")).toHaveText(/^₦\d{1,3}(,\d{3})+$/);
  });

  test("dragging the card left advances the deck @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    const firstTitle = (await card.getByTestId("swipe-card-title").textContent())?.trim();
    const box = await card.boundingBox();
    if (!box) throw new Error("card has no bounding box");
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 80, y, { steps: 5 });
    await page.mouse.move(box.x + box.width / 2 - 220, y, { steps: 5 });
    await page.mouse.up();
    const next = page.getByTestId("swipe-card").first();
    const empty = page.getByTestId("deck-empty");
    await expect(next.or(empty)).toBeVisible();
    if (await next.count()) {
      await expect(next.getByTestId("swipe-card-title")).not.toHaveText(firstTitle ?? "");
    }
  });
});
