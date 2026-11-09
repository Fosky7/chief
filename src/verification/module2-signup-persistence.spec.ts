import { test, expect } from "@playwright/test";

/**
 * Sign-up persistence: create a disposable account through the real form, then
 * reload the page and prove the account still exists by signing in with it
 * through the same UI. No exported keys, no storage shortcuts.
 */
test.describe("Accounts persistence @affected", () => {
  test("a new account survives a full page reload and can sign in @affected @database @persistence", async ({
    page,
  }) => {
    const domain = process.env.E2E_SIGNUP_EMAIL_DOMAIN;
    if (!domain) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "Set E2E_SIGNUP_EMAIL_DOMAIN to a consented disposable mail domain so a throwaway account can receive confirmation mail.",
      });
      test.skip(true, "No disposable sign-up email domain configured");
      return;
    }

    const email = `chief-persist-${Date.now()}@${domain}`;
    const password = "Chief-Persist-2048!";

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("radio", { name: "Donor", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({
      timeout: 15_000,
    });

    // Full reload: nothing in this tab can fake the result any more.
    await page.reload();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });
});
