import { test, expect } from "@playwright/test";

const NAIRA_AMOUNT = /^₦\d{1,3}(,\d{3})*$/;

test.describe("Module 4 — swipe deck card on /discover @affected", () => {
  test("top card shows a bill photo and a bill title @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    const photo = card.locator("img").first();
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute("src", /^https?:\/\/.+/);

    await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);
  });

  test("every amount on the card uses the naira symbol with thousands separators @affected", async ({
    page,
  }) => {
    await page.goto("/discover");

    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    await expect(page.getByTestId("top-bill-needed")).toHaveText(NAIRA_AMOUNT);
    await expect(page.getByTestId("top-bill-raised")).toHaveText(NAIRA_AMOUNT);

    // Every rendered money value inside the card must carry the ₦ symbol.
    expect(await card.getByText(/^₦\d/).count()).toBeGreaterThanOrEqual(2);
  });

  test("dragging the top card left reveals the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");

    const deck = page.getByTestId("swipe-deck");
    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    const swipesBefore = Number(await deck.getAttribute("data-swipes"));
    const positionBefore = await page.getByTestId("deck-position").innerText();
    const titleBefore = await page.getByTestId("top-bill-title").innerText();

    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + box!.width * 0.5;
    const startY = box!.y + box!.height * 0.3;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 260, startY, { steps: 18 });
    await page.mouse.up();

    // The gesture commits: the deck advances one card.
    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
    await expect(page.getByTestId("deck-position")).not.toHaveText(positionBefore);

    const total = Number((positionBefore.match(/of\s+(\d+)/) ?? [])[1] ?? "0");
    if (total > 1) {
      await expect(page.getByTestId("top-bill-title")).not.toHaveText(titleBefore);
    }
  });

  test("the Skip button shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");

    const deck = page.getByTestId("swipe-deck");
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
    const swipesBefore = Number(await deck.getAttribute("data-swipes"));

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
  });
});
