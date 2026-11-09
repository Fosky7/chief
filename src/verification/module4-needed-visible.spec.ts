import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover deck shows what is Needed", () => {
  test("renders the Needed label and the needed amount on /discover @affected @module4", async ({
    page,
  }) => {
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: /What's Needed/i })).toBeVisible();

    const card = page.getByTestId("discover-card");
    await expect(card).toBeVisible();
    await expect(page.getByTestId("needed-label")).toHaveText(/Needed/i);
    await expect(page.getByTestId("needed-amount")).toHaveText(/^Needed: /);
  });

  test("marking a bill as needed advances the deck @affected @module4", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByTestId("deck-position")).toHaveText(/Bill 1 of 4/);
    const firstTitle = await page.getByTestId("discover-card").getByRole("heading").innerText();

    await page.getByRole("button", { name: /I'm in/i }).click();

    await expect(page.getByTestId("deck-position")).toHaveText(/Bill 2 of 4/);
    await expect(page.getByTestId("discover-card").getByRole("heading")).not.toHaveText(firstTitle);
  });
});
