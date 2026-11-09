import { test, expect } from "@playwright/test";

/**
 * Module 4 — the top swipe card shows photo, title, Needed/Raised and progress,
 * and the Give (heart) button opens the "Choose an amount" sheet.
 */
test.describe("Module 4 — swipe card contents @affected", () => {
  test("top card shows photo, title, Needed, Raised and a progress bar @affected", async ({ page }) => {
    await page.goto("/discover");

    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    // Photo (alt text is the bill title).
    await expect(card.locator("img").first()).toBeVisible();

    // Title.
    await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);

    // Needed / Raised amounts with the naira symbol and thousands separators.
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(page.getByTestId("top-bill-needed")).toHaveText(/^₦[\d,]+$/);
    await expect(page.getByTestId("top-bill-raised")).toHaveText(/^₦[\d,]+$/);

    // Progress bar.
    await expect(page.getByTestId("top-bill-progress")).toBeVisible();
  });

  test("card links through to the full bill story @affected", async ({ page }) => {
    await page.goto("/discover");
    const storyLink = page.getByRole("link", { name: /Read the full story/ });
    await expect(storyLink).toBeVisible();
    await storyLink.click();
    await expect(page).toHaveURL(/\/bills\/.+$/);
    await expect(page.getByRole("heading", { name: "Story" })).toBeVisible();
  });

  test("Give button opens the Choose an amount sheet with naira presets @affected", async ({ page }) => {
    await page.goto("/discover");

    await page.getByRole("button", { name: "Give", exact: true }).click();

    const sheet = page.getByTestId("amount-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Choose an amount" })).toBeVisible();

    // Presets are rendered in naira with thousands separators.
    await expect(sheet.getByTestId("amount-preset-1000")).toHaveText("₦1,000");
    await expect(sheet.getByTestId("amount-preset-25000")).toHaveText("₦25,000");

    // A custom amount updates the Continue label.
    await sheet.getByTestId("custom-amount-input").fill("7500");
    await expect(sheet.getByTestId("amount-continue")).toHaveText("Continue with ₦7,500");

    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("amount-sheet")).toHaveCount(0);
  });
});
