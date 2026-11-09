import { test, expect } from "@playwright/test";

test.describe("Discover deck data @affected", () => {
  test("shows a bill card with Needed amount @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
    const card = page.getByTestId("swipe-card");
    await expect(card).toBeVisible();
    await expect(card.getByText("Needed")).toBeVisible();
    await expect(card.getByText(/₦/).first()).toBeVisible();
  });
});
