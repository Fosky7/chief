import { test, expect } from "@playwright/test";

test.describe("@affected auth sign in errors", () => {
  test("@affected signing in with an invalid password shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    const email = `nobody-${Date.now()}@example.com`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByRole("alert")).toContainText("Invalid login credentials", { timeout: 15000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});
