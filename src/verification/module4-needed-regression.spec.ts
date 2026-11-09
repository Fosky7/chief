import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover deck regression", () => {
  test("pass and reset keep the deck usable @affected @module4", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByTestId("deck-position")).toHaveText(/Bill 1 of 4/);

    // Pass through every card to reach the empty state.
    for (let i = 0; i < 4; i += 1) {
      await page.getByRole("button", { name: /Pass on this bill/i }).click();
    }

    await expect(page.getByRole("heading", { name: /all caught up/i })).toBeVisible();

    await page.getByRole("button", { name: /Start over/i }).click();

    await expect(page.getByTestId("discover-card")).toBeVisible();
    await expect(page.getByTestId("deck-position")).toHaveText(/Bill 1 of 4/);
  });

  test("other routes still render after the discover fix @affected @module4", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("HeadContent");

    await page.goto("/discover");
    await expect(page.getByTestId("discover-card")).toBeVisible();
  });
});
