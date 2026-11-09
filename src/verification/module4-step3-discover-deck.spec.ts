import { test, expect, type Page } from "@playwright/test";

async function topTitle(page: Page): Promise<string> {
  const title = page.getByTestId("swipe-card").first().getByTestId("swipe-card-title");
  await expect(title).toBeVisible({ timeout: 15_000 });
  return ((await title.textContent()) ?? "").trim();
}

test.describe("Module 4 step 3 — discover deck actions @affected", () => {
  test("clicking Skip shows the next bill with a different title @affected", async ({ page }) => {
    await page.goto("/discover");
    const first = await topTitle(page);
    expect(first.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(first);
    await expect(page.getByTestId("deck-progress")).toHaveText(/^2 of /);
  });

  test("clicking Give opens Choose an amount @affected", async ({ page }) => {
    await page.goto("/discover");
    const first = await topTitle(page);
    await page.getByRole("button", { name: "Give", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦5,000" })).toBeVisible();

    // Cancel keeps the same bill.
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("swipe-card-title").first()).toHaveText(first);

    // Confirming a chosen amount backs the bill and advances.
    await page.getByRole("button", { name: "Give", exact: true }).click();
    await page.getByRole("button", { name: "₦5,000" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Give ₦5,000" }).click();
    await expect(page.getByTestId("backed-count")).toHaveText("Backed: 1");
    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(first);
  });

  test("dragging the top card left shows the next bill @affected", async ({ page }) => {
    await page.goto("/discover");
    const first = await topTitle(page);
    const card = page.getByTestId("swipe-card").first();
    const box = await card.boundingBox();
    if (!box) throw new Error("card has no bounding box");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 80, y, { steps: 5 });
    await page.mouse.move(x - 220, y, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(first);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
