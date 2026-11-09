import { test, expect } from "@playwright/test";

test.describe("@affected dashboard signed-out state", () => {
  test("shows Dashboard heading and Sign in link when signed out", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("nav shows Sign in and not Sign out when signed out", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Sign out", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });
});
