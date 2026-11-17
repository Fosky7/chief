import { expect, test } from "@playwright/test";

test.describe("@affected Module 2 — backend wiring", () => {
  test("auth page renders without configuration crash and keeps role choice", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/auth");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await expect(page.getByRole("radio", { name: "Bill requester", exact: true })).toBeChecked();

    expect(errors.filter((m) => m.includes("not configured"))).toEqual([]);
  });

  test("invalid sign in shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(`nobody-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("not-the-right-password-1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("@database @persistence bill requester sign up shows Account created", async ({ page }) => {
    const base = process.env.E2E_USER_EMAIL;
    if (!base || !base.includes("@")) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL is needed to derive a disposable plus-addressed sign-up email.",
      });
      test.skip(true, "Disposable sign-up email base not configured");
      return;
    }
    const [local, domain] = base.split("@");
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(`${local}+m2${Date.now()}@${domain}`);
    await page.getByLabel("Password", { exact: true }).fill("Chief-M2-pass-2048!");
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({ timeout: 15_000 });
  });

  test("signed in user sees Sign out in the nav", async ({ page }) => {
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
