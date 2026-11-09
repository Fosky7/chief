import { test, expect } from "@playwright/test";

/**
 * Module 4 — the shared ProgressBar renders on the deck card.
 */
test.describe("Module 4 — funding progress bar @affected", () => {
  test("the top card shows a progress bar with a bounded value @affected", async ({ page }) => {
    await page.goto("/discover");

    const bar = page.getByTestId("top-bill-progress");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("role", "progressbar");

    const now = Number(await bar.getAttribute("aria-valuenow"));
    expect(Number.isFinite(now)).toBeTruthy();
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);

    await expect(bar).toHaveAttribute("aria-label", /funding progress$/);
  });

  test("each listed bill carries its own labelled progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    const bar = page
      .getByRole("progressbar", { name: "Baba Tunde's hospital bill funding progress" })
      .first();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-valuenow", "70");
  });
});
