import { test, expect } from "@playwright/test";

test.describe("sign-in routes @affected", () => {
  test("/sign-in renders the sign-in page @affected", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
    await expect(page.getByTestId("brand-link")).toContainText("Chief");
  });

  test("/signin renders a sign-in page @affected", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });

  test("nav Sign in link opens working sign-in page @affected", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByTestId("brand-link")).toContainText("Chief");
    await expect(page.getByText("SwifePay")).toHaveCount(0);
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });

  test("/dashboard and /discover still load @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Page not found")).toHaveCount(0);
    await page.goto("/discover");
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });
});
