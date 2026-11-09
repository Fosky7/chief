import { test, expect } from "@playwright/test";

test.describe("@affected Module 4 step 3 — signed-out dashboard", () => {
  test("@affected signed-out /dashboard shows heading, sign-in link and nav auth state", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByText("Sign out")).toHaveCount(0);
  });
});
