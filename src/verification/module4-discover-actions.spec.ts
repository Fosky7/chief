import { expect, test } from "@playwright/test";

test.describe("Module 4 — discover deck actions @affected", () => {
  test("clicking Skip shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");
    const title = page.getByTestId("swipe-card-title").first();
    await expect(title).toBeVisible({ timeout: 15_000 });
    const first = (await title.textContent())?.trim() ?? "";
    expect(first.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(first, { timeout: 5_000 });
    await expect(page.getByTestId("swipe-card").first()).toBeVisible();
  });

  test("clicking Give opens Choose an amount @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByTestId("swipe-card").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Give", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByRole("button", { name: "₦1,000" })).toBeVisible();
  });

  test("Start swiping on home shows the Discover bills heading @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping", exact: true }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible({ timeout: 15_000 });
  });

  test("clicking Discover bills on home shows the Skip button @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Discover bills/ }).first().click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
