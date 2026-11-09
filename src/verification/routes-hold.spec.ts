import { test, expect } from "@playwright/test";

test.describe("target routes held unchanged @affected", () => {
  test("home shows Chief wordmark in navigation @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Chief home" })).toBeVisible();
    await expect(page).toHaveTitle(/Chief/);
  });

  test("/discover shows Discover heading @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });

  test("/auth shows Sign in control @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

});
