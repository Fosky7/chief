import { test, expect } from "@playwright/test";

test.describe("Chief branding @affected", () => {
  test("navbar shows Chief name and cap logo, not SwipePay @affected", async ({ page }) => {
    await page.goto("/");
    const brand = page.getByRole("link", { name: "Chief home" });
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("Chief");
    await expect(brand.locator("svg").first()).toBeVisible();
    await expect(page.getByText("SwipePay")).toHaveCount(0);
  });

  test("footer shows Chief copyright @affected", async ({ page }) => {
    await page.goto("/");
    const year = new Date().getFullYear();
    const footer = page.getByTestId("footer-brand");
    await expect(footer).toContainText(`© ${year} Chief.`);
    await expect(footer.locator("svg").first()).toBeAttached();
  });

  test("brand link navigates home @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("link", { name: "Chief home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
