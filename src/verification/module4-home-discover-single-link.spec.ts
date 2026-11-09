import { test, expect } from "@playwright/test";

/**
 * Module 4 — the home page has exactly ONE control named "Discover" in the
 * accessibility tree at any width, and it really opens the swipe deck.
 *
 * Drives the real UI only: no mocks, no storage shortcuts.
 */
test.describe("Module 4 — single Discover entry point into the deck @affected", () => {
  const viewports = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "phone", width: 390, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    test(`exactly one Discover link opens the deck (${viewport.name}) @affected`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(
        page.getByRole("heading", { level: 1, name: /pay a bill with a swipe/i }),
      ).toBeVisible();

      const discover = page.getByRole("link", { name: "Discover", exact: true });
      await expect(discover).toHaveCount(1);
      await expect(discover).toBeVisible();

      await discover.click();

      await expect(page).toHaveURL(/\/discover$/);
      await expect(page.getByTestId("swipe-deck")).toBeVisible();
      await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);
      await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
    });
  }

  test("the hero still links to the deck and Skip advances the top card @affected", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const heroLink = page.getByTestId("home-discover-link-wide");
    await expect(heroLink).toBeVisible();
    await expect(heroLink).toHaveAttribute("href", /\/discover$/);
    await heroLink.click();

    const deck = page.getByTestId("swipe-deck");
    await expect(deck).toBeVisible();

    const swipesBefore = Number((await deck.getAttribute("data-swipes")) ?? "0");
    const titleBefore = await page.getByTestId("top-bill-title").innerText();

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-title")).not.toHaveText(titleBefore);
  });
});
