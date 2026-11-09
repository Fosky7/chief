import { test, expect } from "@playwright/test";

/**
 * Module 4, build step 5 — the home page links into the swipe deck.
 *
 * These specs drive the real UI: they load `/`, click the real "Discover"
 * control, land on the real `/discover` deck and then advance the deck with the
 * real "Skip" button. No mocks, no storage shortcuts.
 */
test.describe("Module 4 — home page entry point into the swipe deck @affected", () => {
  test("clicking Discover on the home page opens the swipe deck with a Skip button @affected", async ({
    page,
  }) => {
    await page.goto("/");

    // The home page really rendered.
    await expect(
      page.getByRole("heading", { level: 1, name: /pay a bill with a swipe/i }),
    ).toBeVisible();

    const discoverLink = page.getByRole("link", { name: "Discover", exact: true });
    await expect(discoverLink).toBeVisible();
    await expect(discoverLink).toHaveAttribute("href", /\/discover$/);

    await discoverLink.click();

    // We are on the real deck route and the deck controls are rendered.
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("swipe-deck")).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  });

  test("clicking Skip on the deck revealed from home shows the next bill card @affected", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Discover", exact: true }).click();

    const skip = page.getByRole("button", { name: "Skip", exact: true });
    await expect(skip).toBeVisible();

    const deck = page.getByTestId("swipe-deck");
    await expect(page.getByTestId("top-bill-card")).toBeVisible();

    const swipesBefore = Number((await deck.getAttribute("data-swipes")) ?? "0");
    const positionBefore = await page.getByTestId("deck-position").innerText();
    const titleBefore = await page.getByTestId("top-bill-title").innerText();
    const total = Number((positionBefore.match(/of\s+(\d+)/) ?? [])[1] ?? "0");

    await skip.click();

    // The deck registers the skip and a top card is still rendered.
    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
    await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);

    // With more than one bill the cursor really moved on to a different card.
    if (total > 1) {
      await expect(page.getByTestId("deck-position")).not.toHaveText(positionBefore);
      await expect(page.getByTestId("top-bill-title")).not.toHaveText(titleBefore);
    }
  });

  test("the Discover entry point and the primary calls to action survive a phone viewport @affected", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Start swiping" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Post a bill/ })).toBeVisible();

    const discoverLink = page.getByRole("link", { name: "Discover", exact: true });
    await expect(discoverLink).toBeVisible();
    await discoverLink.click();

    await expect(page.getByTestId("swipe-deck")).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  });
});
