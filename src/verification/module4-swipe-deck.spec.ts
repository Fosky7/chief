import { test, expect } from "@playwright/test";

const NAIRA_AMOUNT = /^₦\d{1,3}(,\d{3})*$/;

test.describe("Module 4 — discover swipe deck wiring @affected", () => {
  test("top card shows photo, title, Needed, Raised and a progress bar @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    const photo = card.locator("img").first();
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute("src", /^https?:\/\/.+/);

    await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(page.getByTestId("top-bill-needed")).toHaveText(NAIRA_AMOUNT);
    await expect(page.getByTestId("top-bill-raised")).toHaveText(NAIRA_AMOUNT);

    const bar = page.getByTestId("top-bill-progress");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("role", "progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", /^\d+$/);
  });

  test("clicking Skip shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");

    const deck = page.getByTestId("swipe-deck");
    await expect(page.getByTestId("top-bill-card")).toBeVisible();

    const swipesBefore = Number(await deck.getAttribute("data-swipes"));
    const positionBefore = await page.getByTestId("deck-position").innerText();
    const titleBefore = await page.getByTestId("top-bill-title").innerText();

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(deck).toHaveAttribute("data-swipes", String(swipesBefore + 1));
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
    await expect(page.getByTestId("deck-position")).not.toHaveText(positionBefore);

    const total = Number((positionBefore.match(/of\s+(\d+)/) ?? [])[1] ?? "0");
    if (total > 1) {
      await expect(page.getByTestId("top-bill-title")).not.toHaveText(titleBefore);
    }
  });

  test("clicking Give opens Choose an amount @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByTestId("top-bill-card")).toBeVisible();

    await page.getByRole("button", { name: "Give", exact: true }).click();

    const sheet = page.getByTestId("amount-sheet");
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
    await expect(sheet.getByTestId("custom-amount-input")).toBeVisible();

    // Presets are naira formatted and selecting one updates the summary.
    await page.getByTestId("amount-preset-5000").click();
    await expect(sheet.getByText("You're giving", { exact: false })).toBeVisible();
    await expect(sheet.getByRole("link", { name: /Continue with ₦5,000/ })).toBeVisible();

    // Closing via Cancel dismisses the sheet back to the deck.
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId("top-bill-card")).toBeVisible();
  });
});
