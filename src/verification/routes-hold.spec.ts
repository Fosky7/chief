import { test, expect } from "@playwright/test";

test.describe("target routes held unchanged @affected", () => {
  test("home shows Chief wordmark in navigation @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Chief home" })).toBeVisible();
    await expect(page).toHaveTitle(/Chief/);
  });


  test("/auth shows Sign in control @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("/dashboard shows Sign in to signed-out visitor @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Sign in to continue" })).toBeVisible();
    await expect(page.getByText("Signed in as")).toHaveCount(0);
  });
});
