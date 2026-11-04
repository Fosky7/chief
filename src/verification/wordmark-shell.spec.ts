import { test, expect } from "@playwright/test";

// application-name and og:site_name meta come from the static index.html head.
test.describe("Chief shared wordmark @affected", () => {
  test("brand link renders shared wordmark with cap logo and Chief text @affected", async ({ page }) => {
    await page.goto("/");
    const brand = page.getByTestId("brand-link");
    await expect(brand).toBeVisible();
    await expect(brand).toHaveAccessibleName("Chief home");
    await expect(brand).toContainText("Chief");
    await expect(brand.getByTestId("chief-logo")).toHaveCount(1);
    await expect(brand.getByTestId("chief-logo")).toBeVisible();
    await expect(page.getByText(/Swi(p|f)ePay/i)).toHaveCount(0);
  });

  test("footer keeps decorative logo and copyright text @affected", async ({ page }) => {
    await page.goto("/");
    const year = new Date().getFullYear();
    const footer = page.getByTestId("footer-brand");
    await expect(footer).toContainText(`© ${year} Chief. Every bill is reviewed before it goes live.`);
    await expect(footer.getByTestId("chief-logo")).toHaveAttribute("aria-hidden", "true");
  });

  test("head meta includes Chief application-name and og:site_name @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Chief/);
    await expect(page.locator('meta[name="application-name"]').first()).toHaveAttribute("content", "Chief");
    await expect(page.locator('meta[property="og:site_name"]').first()).toHaveAttribute("content", "Chief", { timeout: 10000 });
  });

  test("clicking brand link from discover goes home @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.getByTestId("brand-link").click();
    await expect(page).toHaveURL(/\/$/);
  });
});
