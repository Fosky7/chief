import { test, expect } from "@playwright/test";

test.describe("Module 2 — navigation auth state @affected", () => {
  test("signed-out nav Sign in opens the /auth form", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
    await nav.getByRole("link", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("failed sign in keeps the visitor signed out", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(`nobody-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("WrongPassword!123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });
});
