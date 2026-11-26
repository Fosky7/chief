import { expect, test } from "@playwright/test";

test.describe("Module 2 — backend wiring @affected", () => {
  test("auth page renders without client init errors and offers only self-selectable roles", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/auth");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(page.getByRole("radio", { name: "Donor", exact: true })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Bill requester", exact: true })).toBeVisible();
    await expect(page.getByRole("radio", { name: /admin/i })).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("wrong password shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(`wiring-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("not-the-right-one-42");
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
    await page.getByLabel("Email", { exact: true }).fill(`${local}+wiring${Date.now()}@${domain}`);
    await page.getByLabel("Password", { exact: true }).fill("Chief-Wiring-2024!");
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({ timeout: 15_000 });
  });
});
