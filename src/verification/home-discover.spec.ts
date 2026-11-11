import { test, expect } from "@playwright/test";

/**
 * Module 4 — home page entry points into the swipe deck.
 *
 * One test per flow: reaching the deck by clicking from the home page (both the
 * "Start swiping" and "Discover bills" doorways) and asserting the top card
 * renders its photo, title, naira-formatted Needed / Raised amounts and its
 * funding progress bar, plus that the deck renders every approved bill as a
 * stacked card with its own progress bar.
 */
test.describe("Home page entry point into the swipe deck @affected", () => {
  test("home page CTAs open the deck with a naira-formatted top card @affected", async ({
    page,
  }) => {
    await page.goto("/");

    // Both doorways into the deck are reachable from the home page.
    const startSwiping = page.getByRole("link", { name: "Start swiping", exact: true });
    await expect(startSwiping).toBeVisible();

    await page.getByRole("link", { name: "Discover bills", exact: true }).first().click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByRole("heading", { name: "Discover bills", level: 1 })).toBeVisible();

    const topCard = page.getByTestId("swipe-card-top");
    await expect(topCard).toBeVisible();
    await expect(topCard.getByTestId("swipe-card-title")).not.toBeEmpty();
    await expect(topCard.getByRole("img").first()).toBeVisible();
    await expect(topCard.getByText("Needed", { exact: true })).toBeVisible();
    await expect(topCard.getByText("Raised", { exact: true })).toBeVisible();
    await expect(topCard.getByTestId("swipe-card-needed")).toHaveText(/^\u20a6[\d,]+$/);
    await expect(topCard.getByTestId("swipe-card-raised")).toHaveText(/^\u20a6[\d,]+$/);
    await expect(topCard.getByRole("progressbar")).toBeVisible();

    // The deck renders every verified bill as its own card: each carries its
    // own funding progress bar and the counter reflects the full deck size.
    await expect(page.getByRole("progressbar")).toHaveCount(4);
    await expect(page.getByTestId("swipe-card-under")).toHaveCount(3);
    await expect(page.getByTestId("deck-position")).toHaveText("Bill 1 of 4");

    // The secondary home CTA reaches the same deck.
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping", exact: true }).click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId("swipe-card-top")).toBeVisible();
  });

  test("dragging the top card left reveals the next bill @affected", async ({ page }) => {
    await page.goto("/discover");

    const topCard = page.getByTestId("swipe-card-top");
    await expect(topCard).toBeVisible();
    const firstTitle = await page.getByTestId("swipe-card-title").innerText();
    await expect(page.getByTestId("deck-position")).toHaveText("Bill 1 of 4");

    // Real pointer drag well past the skip threshold.
    const box = await topCard.boundingBox();
    if (!box) throw new Error("top card has no box");
    const startX = box.x + box.width - 24;
    const startY = box.y + 40;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 80, startY, { steps: 8 });
    await page.mouse.move(startX - 220, startY, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByTestId("deck-position")).toHaveText("Bill 2 of 4");
    await expect(page.getByTestId("swipe-card-title")).not.toHaveText(firstTitle);
    await expect(page.getByTestId("swipe-card-top")).toBeVisible();
  });
});
