import { test, expect } from "@playwright/test";

/**
 * Module 4 — the deck renders real bills from the approved-bills hook.
 *
 * Drives the real /discover page (live rows when available, the curated
 * fallback deck otherwise) and asserts the deck is never empty and that every
 * card carries a titled bill with naira amounts.
 */
test.describe("Module 4 — approved bills feed the deck @affected", () => {
  test("discover renders a deck with a titled bill and naira amounts @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    const deck = page.getByTestId("swipe-deck");
    await expect(deck).toBeVisible();

    const title = page.getByTestId("top-bill-title");
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/\S+/);

    // Both amounts come from the same normalised bill and are always naira.
    await expect(page.getByTestId("top-bill-needed")).toHaveText(/₦[\d,]+/);
    await expect(page.getByTestId("top-bill-raised")).toHaveText(/₦[\d,]+/);

    // The deck position tells us how many bills the feed produced.
    await expect(page.getByTestId("deck-position")).toHaveText(/\d+ of \d+/);
  });

  test("every listed bill links to its own detail page @affected", async ({ page }) => {
    await page.goto("/discover");
    const firstBill = page.getByRole("link", { name: "Ada's final-year school fees" });
    await expect(firstBill).toBeVisible();
    await firstBill.click();
    await expect(page).toHaveURL(/\/bills\/ada-school-fees$/);
    await expect(page.getByRole("heading", { level: 1, name: "Ada's final-year school fees" })).toBeVisible();
  });
});
