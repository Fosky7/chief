import { expect, test } from "@playwright/test";

// Module 7: donation sheet wired into /discover cards. Real Paystack payments
// are never sent from tests; we verify the sheet and checkout entry point.
test.describe("Module 7 — donation sheet on discover @affected", () => {
  test("discover page loads with payments service bundled @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("home Discover link shows a bill card with Donate or the empty state @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-discover-link").click();
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const card = page.getByTestId("swipe-card").first();
    const empty = page.getByTestId("discover-empty");
    await expect(card.or(empty)).toBeVisible({ timeout: 15_000 });

    if (await empty.isVisible()) {
      await expect(empty).toContainText("No bills to discover yet");
      return;
    }
    await expect(card.getByRole("button", { name: "Donate", exact: true })).toBeVisible();
    await expect(card.getByText("Raised")).toBeVisible();
  });

  test("clicking Donate opens Choose an amount with presets and custom amount @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    const empty = page.getByTestId("discover-empty");
    await expect(card.or(empty)).toBeVisible({ timeout: 15_000 });
    if (await empty.isVisible()) {
      await expect(empty).toContainText("No bills to discover yet");
      return;
    }

    const donate = card.getByRole("button", { name: "Donate", exact: true });
    if (await donate.isDisabled()) {
      // Fully funded bill: donation correctly unavailable.
      await expect(card).toContainText(/fully funded|isn't accepting donations/);
      return;
    }
    await donate.click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦1,000" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦5,000" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦10,000" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Pay remaining" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Donate with Paystack" })).toBeVisible();

    await dialog.getByLabel("Custom amount").fill("2500");
    await expect(dialog.getByTestId("donate-summary")).toContainText("₦2,500");

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
