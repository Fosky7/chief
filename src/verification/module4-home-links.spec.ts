import { test, expect } from "@playwright/test";

test.describe("Module 4 — home and nav link to discover deck @affected", () => {
  test("clicking Start discovering opens the deck with Skip and Give @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start discovering" }).first().click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("button", { name: /^Skip/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^Give/ }).first()).toBeVisible();
  });

  test("clicking the Discover nav link shows Skip @affected", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Discover", exact: true })
      .click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("button", { name: /^Skip/ }).first()).toBeVisible();
  });
});
