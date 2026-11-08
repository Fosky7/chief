import { test, expect } from "@playwright/test";

test.describe("Module 4 swipe card @affected", () => {
  test("top card shows photo, title, Needed/Raised in naira and progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card");
    await expect(card).toBeVisible();
    await expect(page.getByTestId("swipe-card-title")).not.toHaveText("");
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(page.getByTestId("swipe-card-needed")).toHaveText(/^₦\d{1,3}(,\d{3})+$/);
    await expect(page.getByTestId("swipe-card-raised")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
    await expect(card.getByRole("progressbar")).toBeVisible();
    await expect(card.locator("img").first()).toBeVisible();
  });

  test("short drag snaps back and keeps the same bill @affected", async ({ page }) => {
    await page.goto("/discover");
    const title = page.getByTestId("swipe-card-title");
    await expect(title).toBeVisible();
    const first = (await title.textContent())?.trim() ?? "";
    const box = await title.boundingBox();
    if (!box) throw new Error("card title not laid out");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 30, y, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    await expect(title).toHaveText(first);
  });
});
