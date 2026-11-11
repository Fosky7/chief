import { test, expect } from "@playwright/test";

test.describe("Accounts & role selection @affected", () => {
  test("sign in form shows email, password and sign in button @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("create an account shows role options @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Bill requester" })).toBeVisible();
  });

  test("invalid password shows error @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL ?? "nobody.chief.e2e@mailinator.com");
    await page.getByLabel("Password").fill("definitely-wrong-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("sign up as bill requester shows Account created @affected @database @persistence", async ({ page }) => {
    const email = `chief.e2e.${Date.now()}@mailinator.com`;
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("E2e-Disposable-Pass1!");
    await page.getByRole("radio", { name: "Bill requester" }).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({ timeout: 15000 });
  });

  test("after signing in the nav shows Sign out @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account not provided.",
      });
      test.skip(true, "Disposable test account credentials are not configured.");
      return;
    }
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Sign out" }).or(page.getByRole("link", { name: "Sign out" })).first()).toBeVisible({ timeout: 15000 });
  });
});
