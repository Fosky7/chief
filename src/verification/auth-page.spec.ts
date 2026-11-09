import { test, expect } from "@playwright/test";

const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;

function plusAddress(email: string, tag: string): string {
  const [local, domain] = email.split("@");
  return `${local.split("+")[0]}+${tag}@${domain}`;
}

test.describe("Module 2 — /auth page @affected", () => {
  test("shows Email, Password and Sign in @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("Create an account reveals role options @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Bill requester" })).toBeVisible();
  });

  test("invalid password shows Invalid login credentials @affected", async ({ page }) => {
    await page.goto("/auth");
    const email = userEmail ?? `chief.nobody.${Date.now()}@example.com`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("definitely-wrong-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("sign up as Bill requester shows Account created @affected @database", async ({ page }) => {
    if (!userEmail) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL is needed to derive a disposable plus-addressed sign-up email.",
      });
      test.skip(true, "Disposable sign-up inbox not configured");
      return;
    }
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email").fill(plusAddress(userEmail, `signup${Date.now()}`));
    await page.getByLabel("Password").fill(`Chief-${Date.now()}-pw`);
    await page.getByRole("radio", { name: "Bill requester" }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Account created", { timeout: 15000 });
  });

  test("after signing in the navigation shows Sign out @affected", async ({ page }) => {
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
    await expect(page.getByRole("button", { name: /Sign out/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
