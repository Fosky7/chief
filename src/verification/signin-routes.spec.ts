import { test, expect } from "@playwright/test";

test.describe("sign-in routes @affected", () => {
  test("/sign-in loads the sign-in page @affected", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("/signin redirects to /auth @affected", async ({ page }) => {
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });

  test("home shows Chief branding and NavBar sign-in link works @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("brand-link")).toBeVisible();
    await expect(page.getByText("SwifePay")).toHaveCount(0);
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });

  for (const path of ["/dashboard", "/discover"]) {
    test(`${path} loads directly without 404 @affected`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("brand-link")).toBeVisible();
      await expect(page.getByText("Page not found")).toHaveCount(0);
    });
  }
});
