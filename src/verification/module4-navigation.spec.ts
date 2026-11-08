import { test, expect } from "@playwright/test";

test.describe("Module 4 — home & nav link to discover deck @affected", () => {
  test("Start swiping on home opens /discover with a Needed amount @affected", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping" }).first().click();
    await expect(page).toHaveURL(/\/discover\/?$/);
    await expect(page.getByText("Needed", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/₦\d{1,3}(,\d{3})+/).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("Discover in the navigation opens /discover showing Skip @affected", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Discover", exact: true }).click();
    await expect(page).toHaveURL(/\/discover\/?$/);
    await expect(page.getByRole("button", { name: /skip/i }).first()).toBeVisible();
  });
});
