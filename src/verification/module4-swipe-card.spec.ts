import { test, expect } from "@playwright/test";

const NAIRA = /^₦\d{1,3}(,\d{3})*(\.\d{2})?$/;

test.describe("Module 4 — swipe card @affected", () => {
  test("top card shows photo, title, Needed, Raised and progress bar", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByTestId("swipe-card-photo")).toBeVisible();
    await expect(card.getByTestId("swipe-card-title")).not.toBeEmpty();
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(card.getByRole("progressbar")).toBeVisible();

    const raised = (await card.getByTestId("swipe-card-raised").innerText()).trim();
    expect(raised).toMatch(NAIRA);
    const needed = (await card.getByTestId("swipe-card-needed").innerText()).trim();
    expect(needed.startsWith("₦")).toBe(true);
  });

  test("dragging the top card left reveals a different bill", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    const firstTitle = (await card.getByTestId("swipe-card-title").innerText()).trim();

    const box = await card.boundingBox();
    if (!box) throw new Error("card has no bounding box");
    const y = box.y + box.height / 2;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x - i * 25, y);
    }
    await page.mouse.up();

    await expect(page.getByTestId("swipe-card-title").first()).not.toHaveText(firstTitle, { timeout: 5_000 });
  });
});
