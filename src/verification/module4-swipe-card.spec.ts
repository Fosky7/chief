import { test, expect } from "@playwright/test";

test("@affected top card shows photo, title, amounts and progress bar", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByTestId("bill-photo")).toBeVisible();
  await expect(page.getByTestId("card-title")).toBeVisible();
  await expect(page.getByTestId("amount-needed")).toContainText("₦");
  await expect(page.getByTestId("amount-needed")).toContainText(",");
  await expect(page.getByTestId("amount-raised")).toContainText("₦");
  await expect(page.getByRole("progressbar").first()).toBeVisible();
});

test("@affected Skip advances to the next bill", async ({ page }) => {
  await page.goto("/discover");
  const title = page.getByTestId("card-title");
  await expect(title).toBeVisible();
  const first = await title.textContent();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(title).not.toHaveText(first ?? "");
});

test("@affected Give opens amount chooser", async ({ page }) => {
  await page.goto("/discover");
  await page.getByRole("button", { name: "Give" }).click();
  await expect(page.getByText("Choose an amount")).toBeVisible();
});

test("@affected dragging card left shows next bill", async ({ page }) => {
  await page.goto("/discover");
  const card = page.getByTestId("swipe-card");
  const title = page.getByTestId("card-title");
  await expect(card).toBeVisible();
  const first = await title.textContent();
  const box = await card.boundingBox();
  if (!box) throw new Error("card has no bounding box");
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y, { steps: 5 });
  await page.mouse.move(x - 250, y, { steps: 5 });
  await page.mouse.up();
  await expect(title).not.toHaveText(first ?? "");
  await expect(page.getByTestId("amount-needed")).toContainText(",");
});
