import { test, expect } from "@playwright/test";

/**
 * Module 4 — deck interactions: Skip advances, Give opens the amount sheet and
 * dragging the top card left reveals the next bill.
 */
test.describe("Module 4 — swipe deck interactions @affected", () => {
  test("Skip shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");

    const deck = page.getByTestId("swipe-deck");
    await expect(deck).toBeVisible();
    await expect(page.getByTestId("top-bill-card")).toBeVisible();

    const swipesBefore = Number((await deck.getAttribute("data-swipes")) ?? "0");
    const titleBefore = await page.getByTestId("top-bill-title").innerText();

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-title")).not.toHaveText(titleBefore);
  });

  test("Give opens the Choose an amount sheet @affected", async ({ page }) => {
    await page.goto("/discover");

    await page.getByRole("button", { name: "Give", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("custom-amount-input")).toBeVisible();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("dragging the top card left shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");

    const deck = page.getByTestId("swipe-deck");
    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    const swipesBefore = Number((await deck.getAttribute("data-swipes")) ?? "0");
    const titleBefore = await page.getByTestId("top-bill-title").innerText();

    const box = await card.boundingBox();
    if (!box) throw new Error("The top card has no layout box to drag.");
    const startX = box.x + box.width / 2;
    const y = box.y + 40;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 220, y, { steps: 12 });
    await page.mouse.up();

    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-title")).not.toHaveText(titleBefore);
  });
});
