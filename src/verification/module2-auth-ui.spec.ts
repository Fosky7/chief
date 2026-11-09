import { expect, test } from "@playwright/test";

const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;

test.describe("Module 2 authentication UI @affected", () => {
  test("shows sign in as the default account mode", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("create an account shows Donor and Bill requester roles", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    const donor = page.getByRole("radio", { name: "Donor" });
    const requester = page.getByRole("radio", { name: "Bill requester" });
    await expect(donor).toBeChecked();
    await requester.check();
    await expect(requester).toBeChecked();
    await expect(donor).not.toBeChecked();
  });

  test("invalid password shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(userEmail ?? "nobody.chief.e2e@example.com");
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("sign up as Bill requester shows Account created @database", async ({ page }) => {
    if (!userEmail || !userEmail.includes("@")) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL is needed to derive a disposable plus-addressed sign-up email.",
      });
      test.skip(true, "Disposable sign-up email base not configured");
      return;
    }
    const [local, domain] = userEmail.split("@");
    const disposable = `${local}+chief${Date.now()}@${domain}`;

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(disposable);
    await page.getByLabel("Password", { exact: true }).fill("Chief-E2E-pass-2024!");
    await page.getByRole("radio", { name: "Bill requester" }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("after signing in the navigation shows Sign out", async ({ page }) => {
    if (!userEmail || !userPassword) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL and E2E_USER_PASSWORD are required to sign in.",
      });
      test.skip(true, "Test account credentials not configured");
      return;
    }
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(userEmail);
    await page.getByLabel("Password", { exact: true }).fill(userPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(page.getByRole("button", { name: "Sign out" }).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
