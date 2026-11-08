import { expect, test } from "@playwright/test";

test.describe("@affected authentication route repair", () => {
  test("home retains its authentication navigation control", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });

  test("/sign-in lands on the canonical /auth page", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create an account" })).toBeVisible();

    const email = page.getByLabel("Email");
    await email.fill("person@example.com");
    await expect(email).toHaveValue("person@example.com");
  });

  test("/signin lands on the canonical /auth page", async ({ page }) => {
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("account creation exposes role selection through the real UI", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.getByRole("group", { name: "I'm joining as" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Donor" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Bill requester" })).toBeVisible();
  });
});
