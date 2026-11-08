import { test, expect, type Page } from "@playwright/test";

function topTitle(page: Page) {
  return page.getByTestId("discover-deck").getByRole("heading").first();
}

async function readTitle(page: Page): Promise<string> {
  const h = topTitle(page);
  await expect(h).toBeVisible();
  await expect(h).not.toHaveText("");
  return (await h.innerText()).trim();
}

test.describe("Module 4 — swipe deck interactions @affected", () => {
  test("Skip shows a different bill title @affected", async ({ page }) => {
    await page.goto("/discover");
    const first = await readTitle(page);
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await expect(topTitle(page)).not.toHaveText(first, { timeout: 5000 });
  });

  test("Give opens the amount panel @affected", async ({ page }) => {
    await page.goto("/discover");
    await readTitle(page);
    await page.getByRole("button", { name: "Give", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Choose an amount")).toBeVisible();
  });

  test("dragging the top card left shows a different bill title @affected", async ({ page }) => {
    await page.goto("/discover");
    const first = await readTitle(page);
    const box = await page.getByTestId("discover-deck").boundingBox();
    if (!box) throw new Error("deck not rendered");
    const startX = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 80, y, { steps: 5 });
    await page.mouse.move(startX - 320, y, { steps: 10 });
    await page.mouse.up();
    await expect(topTitle(page)).not.toHaveText(first, { timeout: 5000 });
  });

  test("home Start swiping opens discover with a Needed card @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping" }).first().click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId("discover-deck").getByText("Needed", { exact: false }).first()).toBeVisible();
  });
});
