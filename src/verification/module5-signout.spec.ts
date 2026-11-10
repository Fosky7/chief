import { test, expect } from "@playwright/test";

const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;

test.describe("Module 5 — sign out after real sign in @affected", () => {
  test("signing in reveals Sign out and signing out returns to Sign in @affected", async ({ page }) => {
    if (!userEmail || !userPassword) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL and E2E_USER_PASSWORD are required to sign in through the UI.",
      });
      test.skip(true, "Disposable account credentials not configured");
      return;
    }

    await page.goto("/auth");
    await page.getByLabel("Email").fill(userEmail);
    await page.getByLabel("Password").fill(userPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

    const signOut = page.getByRole("button", { name: "Sign out", exact: true });
    await expect(signOut).toBeVisible({ timeout: 15000 });

    await signOut.click();

    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
  });
});
