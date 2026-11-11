import { expect, test } from "@playwright/test";

test.describe("Module 4 — links to the discover deck @affected", () => {
  test("home Discover link opens a bill card with Needed @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-discover-link").click();
    await expect(page).toHaveURL(/\/discover/);
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByTestId("card-needed")).toHaveText(/^₦/);
  });

  test("navigation Discover link shows the bill card with Skip @affected", async ({ page }) => {
    await page.goto("/discover");
    const navLink = page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Discover", exact: true });
    await expect(navLink).toBeVisible({ timeout: 15_000 });
    await navLink.click();
    await expect(page).toHaveURL(/\/discover/);
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  });
});
