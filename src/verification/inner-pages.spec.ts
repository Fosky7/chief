import { test, expect } from "@playwright/test";

test.describe("Inner pages redesign @affected", () => {

  test("sign-in form renders with fields and Sign in button @affected", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  });

  test("signed-out dashboard links to sign in @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    const cta = page.getByRole("link", { name: "Sign in to continue" });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page).toHaveURL(/\/auth/);
  });
});
