import { test, expect } from "@playwright/test";

test.describe("Module 2 — session in navigation @affected", () => {
  test("signing in shows Sign out in the nav, signing out restores Sign in @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Disposable account credentials (E2E_USER_EMAIL / E2E_USER_PASSWORD) are not configured.",
      });
    }
    test.skip(!email || !password, "Disposable test account credentials are not configured.");

    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    const nav = page.getByRole("navigation", { name: "Main" });
    const signOut = nav.getByRole("button", { name: "Sign out", exact: true });
    await expect(signOut).toBeVisible({ timeout: 15_000 });

    // Session persists across reload.
    await page.reload();
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toBeVisible({ timeout: 15_000 });

    await nav.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(nav.getByRole("link", { name: "Sign in", exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
