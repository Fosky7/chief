import { expect, test, type Page } from "@playwright/test";

async function topTitle(page: Page): Promise<string> {
  const title = page.getByTestId("bill-card").getByTestId("deck-card-title");
  await expect(title).toBeVisible();
  return (await title.innerText()).trim();
}

test.describe("Module 4 — swipe deck @affected", () => {
  test("clicking Skip shows the next bill with a different title @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/discover");

    const first = await topTitle(page);
    expect(first.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Skip", exact: true }).click();

    const title = page.getByTestId("bill-card").getByTestId("deck-card-title");
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText(first);
    await expect(page.getByTestId("bill-card")).toContainText("Needed");
    expect(errors).toEqual([]);
  });

  test("clicking Give opens Choose an amount @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/discover");
    await topTitle(page);

    await page.getByRole("button", { name: "Give", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
    await expect(dialog).toContainText("₦1,000");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("dragging the top card left shows the next bill @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/discover");

    const first = await topTitle(page);
    const card = page.getByTestId("bill-card");
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const x = box.x + box.width / 2;
    const y = box.y + Math.min(box.height / 2, 120);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 120, y, { steps: 6 });
    await page.mouse.move(x - 260, y, { steps: 6 });
    await page.mouse.up();

    const title = page.getByTestId("bill-card").getByTestId("deck-card-title");
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText(first);
    expect(errors).toEqual([]);
  });
});
