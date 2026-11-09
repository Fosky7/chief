import { test, expect } from "@playwright/test";

/**
 * Module 4 — home page entry point into the swipe deck.
 *
 * One test per flow: reaching the deck by clicking from the home page and
 * asserting the top card renders its photo, title, naira-formatted Needed /
 * Raised amounts and its funding progress bar, plus that the deck renders every
 * approved bill as a stacked card with its own progress bar.
 */
test.describe("Home page entry point into the swipe deck @affected", () => {
  test("clicking Discover on the home page opens the deck with a naira-formatted top card @affected", async ({
    page,
  }) => {
    await page.goto("/");

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

    // The deck renders as a stack: every verified bill carries its own funding
    // progress bar and the counter reflects the full deck size.
    await expect(page.getByRole("progressbar")).toHaveCount(4);
    await expect(page.getByTestId("deck-position")).toHaveText("Bill 1 of 4");
  });
});
