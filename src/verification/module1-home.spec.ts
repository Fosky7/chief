import { test, expect } from "@playwright/test";

test.describe("Module 1 — welcome page & navigation @affected", () => {
  test("hero heading shows the tagline @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pay a bill with a swipe");
  });

  test("Start swiping opens Discover bills @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping" }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
  });

  test("Post a bill opens Sign in @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Post a bill" }).click();
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("navigation bar shows Discover, Dashboard and Sign in @affected", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Discover", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("sample stats show ₦1,000,000 @affected", async ({ page }) => {
    await page.goto("/");
    const stats = page.getByRole("region", { name: "Sample stats" });
    await expect(stats.getByText("₦1,000,000", { exact: true })).toBeVisible();
  });
});
