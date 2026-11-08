import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover actions @affected", () => {
  test("clicking Skip shows the next bill with a different title @affected", async ({ page }) => {
    await page.goto("/discover");
    const title = page.getByTestId("swipe-card-title").first();
    await expect(title).toBeVisible({ timeout: 15_000 });
    const firstTitle = (await title.innerText()).trim();
    expect(firstTitle.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(firstTitle, { timeout: 5_000 });
    await expect(page.getByTestId("swipe-card-title").first()).not.toBeEmpty();
  });

  test("clicking Give opens Choose an amount @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByTestId("swipe-card").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Give", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦5,000" })).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("clicking Discover on home shows the deck with a Needed amount @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Discover", exact: true }).first().click();

    await expect(page).toHaveURL(/\/discover$/);
    const deck = page.getByTestId("discover-deck");
    await expect(deck).toBeVisible();
    await expect(deck.getByText("Needed", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(deck.getByTestId("swipe-card-needed").first()).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
  });
});
