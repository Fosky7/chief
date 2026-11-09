import { test, expect } from "@playwright/test";

/**
 * Module 4 — swipe deck interactions.
 * One test per flow: the rendered deck (photo, Needed/Raised naira amounts and
 * a progress bar per stacked card), Skip, Give (amount sheet) and the left drag
 * gesture on the top card.
 */
test.describe("Module 4 — swipe deck interactions @affected", () => {
  test("the deck renders every bill card with Naira amounts and a progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    const top = page.getByTestId("swipe-card-top");
    await expect(top).toBeVisible();
    await expect(top.getByTestId("swipe-card-photo")).toBeVisible();
    await expect(top.getByTestId("swipe-card-title")).toHaveText("Ada's final-year school fees");
    await expect(top.getByTestId("swipe-card-needed")).toHaveText("₦250,000");
    await expect(top.getByTestId("swipe-card-raised")).toHaveText("₦185,000");
    await expect(top.getByRole("progressbar")).toBeVisible();
    // Four approved bills are in the deck: one progress bar per card.
    await expect(page.getByRole("progressbar")).toHaveCount(4);
  });

  test("clicking Skip shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");
    const top = page.getByTestId("swipe-card-top");
    await expect(top).toBeVisible();
    const firstTitle = (await top.getByTestId("swipe-card-title").innerText()).trim();
    await expect(page.getByTestId("deck-position")).toContainText("Bill 1 of");

    await page.getByTestId("deck-skip").click();

    const next = page.getByTestId("swipe-card-top");
    await expect(next.getByTestId("swipe-card-title")).not.toHaveText(firstTitle);
    await expect(page.getByTestId("deck-position")).toContainText("Bill 2 of");
  });

  test("clicking Give opens the Choose an amount sheet @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.getByTestId("deck-give").click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();

    const preset = dialog.getByTestId("give-amount-5000");
    await preset.click();
    await expect(preset).toHaveAttribute("aria-pressed", "true");

    await dialog.getByRole("link", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/bills\//);
  });

  test("dragging the top card left shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");
    const top = page.getByTestId("swipe-card-top");
    await expect(top).toBeVisible();
    const firstTitle = (await top.getByTestId("swipe-card-title").innerText()).trim();

    const box = await top.boundingBox();
    if (!box) throw new Error("Top card has no bounding box to drag");
    const startX = box.x + box.width / 2;
    const startY = box.y + 40;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 260, startY, { steps: 12 });
    await page.mouse.up();

    const next = page.getByTestId("swipe-card-top");
    await expect(next.getByTestId("swipe-card-title")).not.toHaveText(firstTitle);
    await expect(page.getByTestId("deck-position")).toContainText("Bill 2 of");
  });
});
