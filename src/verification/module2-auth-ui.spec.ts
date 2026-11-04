import { expect, test } from "@playwright/test";

test.describe("Module 2 authentication UI @affected", () => {
  test("shows sign in as the default account mode", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("supports accessible role selection during account creation", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("group", { name: "I'm joining as" })).toBeVisible();

    const donor = page.getByRole("radio", { name: "Donor" });
    const requester = page.getByRole("radio", { name: "Bill requester" });

    await expect(donor).toBeChecked();
    await requester.check();
    await expect(requester).toBeChecked();
    await expect(donor).not.toBeChecked();
    await expect(page.getByLabel(/Full name/)).toBeVisible();
  });

  test("reports missing fields and short signup passwords without contacting the backend", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();

    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Email is required.");

    await page.getByLabel("Email", { exact: true }).fill("module2@example.com");
    await page.getByLabel("Password", { exact: true }).fill("12345");
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.getByRole("alert")).toHaveText("Password must be at least 6 characters.");
    await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
  });
});
