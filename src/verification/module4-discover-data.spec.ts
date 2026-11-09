import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover data @affected", () => {
  test("discover shows heading and Needed count @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("discover-count")).toContainText("Needed");
  });

  test("search filters bills @affected", async ({ page }) => {
    await page.goto("/discover");
    const cards = page.getByTestId("discover-card");
    const before = await cards.count();
    expect(before).toBeGreaterThan(0);
    await page.getByTestId("discover-search").fill("water");
    await expect(cards).toHaveCount(1);
  });
});
