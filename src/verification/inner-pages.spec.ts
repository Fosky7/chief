import { test, expect } from "@playwright/test";

test.describe("Inner pages redesign @affected", () => {

  test("sign-in form renders with fields and Sign in button @affected", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  });

});
