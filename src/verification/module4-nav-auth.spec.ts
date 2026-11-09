import { test, expect } from "@playwright/test";

test.describe("Module 4 nav auth state @affected", () => {
  test("signed out: nav shows Sign in and hides Dashboard/Sign out @affected", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Sign out" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  });

  test("signed in: nav shows Dashboard and Sign out works @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL/E2E_USER_PASSWORD not provided for signed-in nav check",
      });
      test.skip(true, "Disposable test account credentials not configured");
      return;
    }
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 15000 });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();

    await nav.getByRole("button", { name: "Sign out" }).click();
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible({ timeout: 15000 });
    await expect(nav.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  });
});
