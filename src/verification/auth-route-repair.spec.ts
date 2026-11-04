import { expect, test } from "@playwright/test";

test.describe("@affected authentication route repair", () => {
  test("home retains its authentication navigation control", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });

  test("canonical sign-in keeps the email field controlled", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();

    const email = page.getByLabel("Email");
    await email.fill("person@example.com");
    await expect(email).toHaveValue("person@example.com");
  });

  test("account creation exposes role selection through the real UI", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Create an account" }).click();
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.getByRole("group", { name: "I'm joining as" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Donor/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /Bill requester/ })).toBeVisible();
  });

  test("legacy signin alias resolves to the canonical sign-in page", async ({ page }) => {
    await page.goto("/signin");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  });
});
