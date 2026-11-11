import { test, expect } from "@playwright/test";

test.describe("App shell redesign @affected", () => {
  test("nav keeps brand hooks and labels @affected", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const brand = page.getByTestId("brand-link");
    await expect(brand).toBeVisible();
    await expect(brand).toHaveAttribute("aria-label", "Chief home");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Discover", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await nav.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("footer keeps brand text and trust chip @affected", async ({ page }) => {
    await page.goto("/");
    const footerBrand = page.getByTestId("footer-brand");
    await expect(footerBrand).toContainText(`© ${new Date().getFullYear()} Chief.`);
    await expect(page.getByText("Payments secured by Paystack")).toBeVisible();
  });

  test("mobile menu opens and closes on Escape @affected", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle menu" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
    await toggle.click();
    await page.locator("#mobile-menu").getByRole("link", { name: "Discover", exact: true }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
  });

  test("404 page renders and links home @affected", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.getByRole("link", { name: "Go home" }).click();
    await expect(page.getByRole("heading", { name: "Pay a bill with a swipe" })).toBeVisible();
  });
});
