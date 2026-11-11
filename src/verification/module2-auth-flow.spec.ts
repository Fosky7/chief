import { expect, test } from "@playwright/test";

const emailDomain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";

test.describe("Module 2 auth flow @affected", () => {
  test("shows Email, Password and Sign in on /auth", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("Create an account reveals Donor and Bill requester roles", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    const donor = page.getByRole("radio", { name: "Donor", exact: true });
    const requester = page.getByRole("radio", { name: "Bill requester", exact: true });
    await expect(donor).toBeChecked();
    await requester.check();
    await expect(requester).toBeChecked();
    await expect(donor).not.toBeChecked();
  });

  test("invalid password shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(`nobody-${Date.now()}@${emailDomain}`);
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-pass");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("sign up as Bill requester shows Account created", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(`chief-e2e-${Date.now()}@${emailDomain}`);
    await page.getByLabel("Password", { exact: true }).fill("Str0ng-Passw0rd!");
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
