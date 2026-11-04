import { test, expect } from "@playwright/test";

test.describe("Home page redesign @affected", () => {
  test("renders hero, stats and featured bills @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();
    await expect(page.getByText("₦1,000,000").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bills people are paying today" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start swiping", exact: true })).toHaveCount(1);
  });

  test("Start swiping navigates to Discover @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping", exact: true }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByText("Discover bills").first()).toBeVisible();
  });

  test("Post a bill navigates to Sign in @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Post a bill", exact: true }).click();
    await expect(page).toHaveURL(/sign-?in/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
