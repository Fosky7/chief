import { expect, test } from "@playwright/test";

test.describe("@affected Module 2 auth", () => {
  test("form shows Email, Password and Sign in", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("Create an account shows Donor and Bill requester", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Bill requester" })).toBeVisible();
  });

  test("invalid password shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL ?? "nobody@example.com");
    await page.getByLabel("Password").fill("definitely-wrong-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("@database @persistence sign up as Bill requester shows Account created", async ({ page }) => {
    const domain = process.env.E2E_SIGNUP_EMAIL_DOMAIN;
    if (!domain) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Set E2E_SIGNUP_EMAIL_DOMAIN to a consented disposable mail domain to run sign-up.",
      });
      test.skip(true, "No disposable sign-up email domain configured");
    }
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email").fill(`chief-e2e-${Date.now()}@${domain}`);
    await page.getByLabel("Password").fill("E2e-password-12345");
    await page.getByRole("radio", { name: "Bill requester" }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Account created");
  });

  test("after signing in the navigation bar shows Sign out", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account required.",
      });
      test.skip(true, "No disposable test account configured");
    }
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Sign out").first()).toBeVisible();
  });
});
