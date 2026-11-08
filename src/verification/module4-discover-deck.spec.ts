import { test, expect } from "@playwright/test";

test.describe("Module 4 discover deck @affected", () => {
  test("Skip shows a different bill @affected", async ({ page }) => {
    await page.goto("/discover");
    const title = page.getByTestId("swipe-card-title");
    await expect(title).toBeVisible();
    const first = (await title.textContent())?.trim();
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await expect(title).not.toHaveText(first ?? "");
  });

  test("Give opens amount chooser @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("button", { name: "Give", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
  });

  test("Dragging top card left skips @affected", async ({ page }) => {
    await page.goto("/discover");
    const title = page.getByTestId("swipe-card-title");
    await expect(title).toBeVisible();
    const first = (await title.textContent())?.trim();
    const box = await title.boundingBox();
    if (!box) throw new Error("card title not laid out");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x - i * 25, y);
    }
    await page.mouse.up();
    await expect(title).not.toHaveText(first ?? "");
  });
});
