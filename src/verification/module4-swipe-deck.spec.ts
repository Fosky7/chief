import { test, expect } from "@playwright/test";

test.describe("Module 4 swipe deck @affected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByTestId("bill-title")).toBeVisible();
  });

  test("top card shows photo, title, Needed/Raised in Naira and progress bar @affected", async ({ page }) => {
    const card = page.getByTestId("swipe-card-top");
    await expect(card.getByTestId("bill-photo")).toBeVisible();
    await expect(card.getByTestId("bill-title")).not.toBeEmpty();
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();
    await expect(card.getByRole("progressbar")).toBeVisible();
    await expect(card.getByTestId("bill-needed")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
    await expect(card.getByTestId("bill-raised")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
  });

  test("Skip shows a different bill @affected", async ({ page }) => {
    const first = await page.getByTestId("bill-title").innerText();
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByTestId("bill-title")).not.toHaveText(first);
  });

  test("Give opens Choose an amount @affected", async ({ page }) => {
    await page.getByRole("button", { name: "Give" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
  });

  test("dragging the top card left shows a different bill @affected", async ({ page }) => {
    const first = await page.getByTestId("bill-title").innerText();
    const box = await page.getByTestId("bill-photo").boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 120, y, { steps: 8 });
    await page.mouse.move(x - 260, y, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId("bill-title")).not.toHaveText(first);
  });
});
