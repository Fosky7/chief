import { test, expect } from "@playwright/test";

test.describe("Module 4 discover deck @affected", () => {
  test("shows a swipe card with naira amounts @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card");
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("swipe-card-goal")).toContainText("₦");
    await expect(page.getByTestId("swipe-card-goal")).toHaveText(/of ₦\d{1,3}(,\d{3})*/);
  });

  test("skipping through the deck reaches the end state @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByTestId("swipe-card")).toBeVisible({ timeout: 15000 });
    const counter = await page.getByTestId("deck-counter").innerText();
    const total = Number(counter.split("/")[1].trim());
    expect(total).toBeGreaterThan(0);

    const firstTitle = await page.getByTestId("swipe-card-title").innerText();
    await page.getByTestId("swipe-skip").click();
    if (total > 1) {
      await expect(page.getByTestId("deck-counter")).toContainText(`2 / ${total}`);
      await expect(page.getByTestId("swipe-card-title")).not.toHaveText(firstTitle);
    }
    for (let i = 1; i < total; i++) {
      await page.getByTestId("swipe-skip").click();
    }
    await expect(page.getByTestId("deck-end")).toBeVisible();
    await expect(page.getByTestId("deck-end")).toContainText("all caught up");

    await page.getByTestId("deck-restart").click();
    await expect(page.getByTestId("swipe-card")).toBeVisible();
  });

  test("existing pages still render @affected", async ({ page }) => {
    for (const path of ["/", "/auth", "/discover"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});
