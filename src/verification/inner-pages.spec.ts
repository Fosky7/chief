import { test, expect } from "@playwright/test";

test.describe("Inner pages redesign @affected", () => {
  test("discover shows a bill card with a Naira amount and progress @affected", async ({ page }) => {
    // Module 4 replaced the 4-card grid with a one-card-at-a-time swipe deck.
    await page.goto("/discover");
    await expect(page.getByRole("progressbar").first()).toBeVisible();
    await expect(page.getByText(/₦\d/).first()).toBeVisible();
  });

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
