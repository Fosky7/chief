import { test, expect } from "@playwright/test";

/**
 * Module 4 — the home page must offer exactly ONE control named "Discover"
 * (the nav link and the hero CTA used to collide, which broke every
 * accessibility-based lookup) and that control must open the real deck.
 */
test.describe("Module 4 — single home entry point into the swipe deck @affected", () => {
  test("desktop: exactly one Discover link, and it opens the real deck @affected", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /pay a bill with a swipe/i }),
    ).toBeVisible();

    const discover = page.getByRole("link", { name: "Discover", exact: true });
    await expect(discover).toHaveCount(1);
    await expect(discover).toBeVisible();
    await expect(discover).toHaveAttribute("href", /\/discover$/);

    await discover.click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("swipe-deck")).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  });

  test("phone viewport: exactly one visible Discover link into the deck @affected", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Start swiping" })).toBeVisible();

    const discover = page.getByRole("link", { name: "Discover", exact: true });
    await expect(discover).toHaveCount(1);
    await expect(discover).toBeVisible();
    await expect(discover).toHaveAttribute("href", /\/discover$/);

    await discover.click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId("swipe-deck")).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
  });
});
