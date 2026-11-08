import { test, expect } from "@playwright/test";

test.describe("Module 4 swipe deck @affected", () => {
  test("user can skip and fund through the deck until empty, then restart @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    const card = page.getByTestId("swipe-card");
    await expect(card).toBeVisible({ timeout: 15000 });

    const counter = page.getByTestId("deck-counter");
    await expect(counter).toHaveText(/^1 of \d+$/);
    const total = parseInt(((await counter.textContent()) ?? "").split("of")[1].trim(), 10);
    expect(total).toBeGreaterThan(0);

    const firstTitle = await page.getByTestId("swipe-card-title").textContent();
    await page.getByTestId("fund-button").click();

    if (total > 1) {
      await expect(counter).toHaveText(`2 of ${total}`);
      await expect(page.getByTestId("swipe-card-title")).not.toHaveText(firstTitle ?? "");
    }

    for (let i = 1; i < total; i++) {
      await page.getByTestId("skip-button").click();
    }

    await expect(page.getByTestId("deck-empty")).toBeVisible();
    await expect(page.getByTestId("liked-count")).toHaveText("You chose to support 1 bill.");

    await page.getByTestId("restart-deck").click();
    await expect(counter).toHaveText(`1 of ${total}`);
  });

  test("keyboard arrows advance the deck @affected", async ({ page }) => {
    await page.goto("/discover");
    const counter = page.getByTestId("deck-counter");
    await expect(counter).toHaveText(/^1 of \d+$/, { timeout: 15000 });
    const total = parseInt(((await counter.textContent()) ?? "").split("of")[1].trim(), 10);
    await page.keyboard.press("ArrowLeft");
    if (total > 1) await expect(counter).toHaveText(`2 of ${total}`);
    else await expect(page.getByTestId("deck-empty")).toBeVisible();
  });
});
