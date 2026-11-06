import { test, expect } from "@playwright/test";

const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;

test.describe("Accounts & sign up @affected", () => {
  test("auth form shows email, password and sign in @affected", async ({ page }) => {
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
    await page.getByLabel("Email").fill(userEmail ?? "nobody.chief.e2e@example.com");
    await page.getByLabel("Password").fill("definitely-wrong-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("sign up as bill requester shows account created @affected @database", async ({ page }) => {
    const domain = userEmail?.split("@")[1];
    if (!domain) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL is needed to derive a disposable sign-up email domain.",
      });
      test.skip(true, "No disposable email domain available for sign-up.");
      return;
    }
    const email = `chief.e2e.${Date.now()}@${domain}`;
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Chief-e2e-Pass-2024!");
    await page.getByRole("radio", { name: "Bill requester" }).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Account created")).toBeVisible({ timeout: 15000 });
  });

  test("after signing in the nav shows Sign out @affected", async ({ page }) => {
    if (!userEmail || !userPassword) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL and E2E_USER_PASSWORD are required to sign in.",
      });
      test.skip(true, "Disposable account credentials are not configured.");
      return;
    }
    await page.goto("/auth");
    await page.getByLabel("Email").fill(userEmail);
    await page.getByLabel("Password").fill(userPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("navigation").getByText("Sign out").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
