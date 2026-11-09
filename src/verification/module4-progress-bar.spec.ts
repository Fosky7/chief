import { expect, test } from "@playwright/test";

test.describe("Module 4 — discover funding progress bar @affected", () => {
  test("discover renders an accessible progress bar under each raised amount @affected", async ({
    page,
  }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const bar = page.getByRole("progressbar").first();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-label", /funding progress$/i);

    const now = Number(await bar.getAttribute("aria-valuenow"));
    expect(Number.isFinite(now)).toBe(true);
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);
    await expect(bar).toHaveAttribute("aria-valuetext", /% funded$/i);
  });

  test("amounts next to the bar use the naira symbol with thousands separators @affected", async ({
    page,
  }) => {
    await page.goto("/discover");

    const bars = page.getByRole("progressbar");
    await expect(bars.first()).toBeVisible();
    expect(await bars.count()).toBeGreaterThan(0);

    await expect(page.getByText(/raised of ₦\d/).first()).toBeVisible();
    await expect(page.getByText(/₦\d{1,3}(,\d{3})+/, { exact: false }).first()).toBeVisible();
  });

  test("the progress bar still renders on a phone-width viewport @affected", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    const bar = page.getByRole("progressbar").first();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-valuenow", /^\d+$/);
  });
});
