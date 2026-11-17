import { expect, test } from "@playwright/test";

test.describe("Module 2 — role selection & nav auth state @affected", () => {
  test("switching to sign up and back resets the form @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await expect(page.getByRole("radio", { name: "Bill requester", exact: true })).toBeChecked();

    await page.getByRole("button", { name: "Sign in instead" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Donor", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor", exact: true })).toBeChecked();
  });

  test("signed-out nav shows Sign in and no Sign out @affected", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
    await nav.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("signing in shows Sign out in nav @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account required.",
      });
      test.skip(true, "Disposable test account not configured");
      return;
    }
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
