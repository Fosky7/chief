import { test, expect } from "@playwright/test";

test.describe("Chief branding @affected", () => {
  test("navbar shows Chief name and cap logo, not SwipePay @affected", async ({ page }) => {
    await page.goto("/");
    const brand = page.getByRole("link", { name: "Chief home" });
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("Chief");
    await expect(brand.locator("svg").first()).toBeVisible();
    await expect(page.getByText("SwipePay")).toHaveCount(0);
    await expect(page.getByText("SwifePay")).toHaveCount(0);
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

  test("mobile menu shows Chief wordmark with cap logo @affected", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const menuBrand = page.getByTestId("mobile-menu-brand");
    await expect(menuBrand).toBeVisible();
    await expect(menuBrand).toContainText("Chief");
    await expect(menuBrand.locator("svg").first()).toBeVisible();
  });

  test("favicon is served as the chief cap svg @affected", async ({ request }) => {
    const res = await request.get("/favicon.svg");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("Chief");
  });
});
