import { expect, test } from "@playwright/test";

test.describe("Module 4 — swipe card @affected", () => {
  test("top card shows photo, title, Needed/Raised and progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.locator("img").first()).toBeVisible();
    await expect(card.getByTestId("swipe-card-title")).not.toBeEmpty();
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(card.getByTestId("amount-needed")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
    await expect(card.getByTestId("amount-raised")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
    await expect(card.getByRole("progressbar")).toBeVisible();
  });

  test("dragging the top card left shows the next bill @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    const firstTitle = (await card.getByTestId("swipe-card-title").textContent())?.trim() ?? "";
    expect(firstTitle.length).toBeGreaterThan(0);

    const box = await card.getByTestId("swipe-card-title").boundingBox();
    if (!box) throw new Error("card title not laid out");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 80, y, { steps: 5 });
    await page.mouse.move(x - 220, y, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(firstTitle, { timeout: 5_000 });
    await expect(page.getByTestId("swipe-card").first()).toBeVisible();
  });
});
