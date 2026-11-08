import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover deck data @affected", () => {
  test("deck shows a bill card with a Naira-formatted Needed amount @affected", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const deck = page.getByTestId("discover-deck");
    await expect(deck).toBeVisible();
    await expect(deck.getByText(/Needed/i).first()).toBeVisible({ timeout: 15_000 });

    // Top card amounts use ₦ followed by digits with comma thousands separators.
    await expect(deck.getByText(/₦\d{1,3}(,\d{3})+/).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
