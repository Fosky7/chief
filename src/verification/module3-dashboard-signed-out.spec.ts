import { test, expect } from "@playwright/test";

test.describe("@affected dashboard signed out", () => {
  test("shows Dashboard heading, Sign in link, and nav signed-out state", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  });

  test("Sign in link navigates to /auth", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("main").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/auth/);
  });
});
