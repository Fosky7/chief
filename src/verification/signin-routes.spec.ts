import { expect, test } from "@playwright/test";

const confirmedEmail = process.env.E2E_CONFIRMED_EMAIL;
const confirmedPassword = process.env.E2E_CONFIRMED_PASSWORD;

test.describe("@affected authentication entry points", () => {
  test("canonical sign-in page uses the shared account flow", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page).toHaveURL(/\/sign-in\/?$/);
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/auth\/?$/);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("legacy signin route redirects to the canonical sign-in page", async ({ page }) => {
    await page.goto("/signin");

    await expect(page).toHaveURL(/\/sign-in\/?$/);
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  });

  test("anonymous desktop navigation opens the full account page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    const mainNavigation = page.getByRole("navigation", { name: "Main" });
    const signInLink = mainNavigation.getByRole("link", { name: "Sign in", exact: true });
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    await expect(page).toHaveURL(/\/auth\/?$/);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("anonymous mobile navigation opens the full account page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Toggle menu" }).click();
    const mobileMenu = page.locator("#mobile-menu");
    await expect(mobileMenu).toBeVisible();
    await mobileMenu.getByRole("link", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/auth\/?$/);
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  });

  test("confirmed account sign-in updates navigation and sign-out returns home", async ({ page }) => {
    test.skip(
      !confirmedEmail || !confirmedPassword,
      "Set E2E_CONFIRMED_EMAIL and E2E_CONFIRMED_PASSWORD to verify authenticated navigation.",
    );

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/sign-in");
    await page.getByLabel("Email", { exact: true }).fill(confirmedEmail!);
    await page.getByLabel("Password", { exact: true }).fill(confirmedPassword!);
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await expect(page.getByText(`Signed in as ${confirmedEmail}.`, { exact: false })).toBeVisible();

    const mainNavigation = page.getByRole("navigation", { name: "Main" });
    const signOutButton = mainNavigation.getByRole("button", { name: "Sign out", exact: true });
    await expect(signOutButton).toBeVisible();
    await expect(mainNavigation.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);

    await signOutButton.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(mainNavigation.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
    await expect(mainNavigation.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
  });
});
