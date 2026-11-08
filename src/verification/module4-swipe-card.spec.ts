import { test, expect } from "@playwright/test";

test.describe("Module 4 — swipe card @affected", () => {
  test("top card shows photo, title, Needed/Raised amounts and a progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card");
    await expect(card).toBeVisible();

    const title = card.getByRole("heading", { level: 2 });
    await expect(title).toBeVisible();
    const titleText = (await title.textContent())?.trim() ?? "";
    expect(titleText.length).toBeGreaterThan(0);

    await expect(card.getByRole("img", { name: titleText })).toBeVisible();

    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(card.getByTestId("swipe-card-needed")).toHaveText(/^₦\d/);
    await expect(card.getByTestId("swipe-card-raised")).toHaveText(/^₦\d{1,3}(,\d{3})+$/);

    const bar = card.getByRole("progressbar");
    await expect(bar).toBeVisible();
    const now = Number(await bar.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);
  });

  test("a short drag snaps the card back without changing the bill @affected", async ({ page }) => {
    await page.goto("/discover");
    const card = page.getByTestId("swipe-card");
    await expect(card).toBeVisible();
    const before = await card.getByRole("heading", { level: 2 }).textContent();

    const box = await card.boundingBox();
    if (!box) throw new Error("card has no bounding box");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 30, cy, { steps: 5 });
    await page.mouse.up();

    await page.waitForTimeout(400);
    await expect(page.getByTestId("swipe-card").getByRole("heading", { level: 2 })).toHaveText(before ?? "");
  });
});
