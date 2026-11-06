import { test, expect } from "@playwright/test";

test.describe("Module 1 — welcome page & navigation", () => {
  test("hero heading shows the tagline @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();
  });

  test("Start swiping opens Discover bills @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping" }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.locator("main").getByText("Discover bills").first()).toBeVisible();
  });

  test("Post a bill opens Sign in @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Post a bill" }).click();
    await expect(page).toHaveURL(/\/sign-?in/);
    await expect(page.locator("main").getByText(/sign in/i).first()).toBeVisible();
  });

  test("navigation bar shows Discover, Dashboard and Sign in @affected", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Discover" }).first()).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });

  test("sample stats show a naira amount @affected", async ({ page }) => {
    await page.goto("/");
    const stats = page.getByRole("region", { name: "Sample stats" });
    await expect(stats.getByText("₦1,000,000")).toBeVisible();
  });
});
