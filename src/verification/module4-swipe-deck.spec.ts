import { test, expect, type Page } from "@playwright/test";

async function topTitle(page: Page): Promise<string> {
  const heading = page.getByTestId("swipe-card-top").getByRole("heading");
  await expect(heading).toBeVisible();
  return (await heading.innerText()).trim();
}

test.describe("Module 4 — swipe deck interactions @affected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByTestId("swipe-card-top")).toBeVisible();
  });

  test("clicking Skip shows a different bill title on the top card @affected", async ({ page }) => {
    const before = await topTitle(page);
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await expect(page.getByTestId("swipe-card-top").getByRole("heading")).not.toHaveText(before);
    expect((await topTitle(page)).length).toBeGreaterThan(0);
  });

  test("clicking Give opens Choose an amount @affected", async ({ page }) => {
    await page.getByRole("button", { name: "Give", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "₦2,500" }).click();
    await expect(dialog.getByRole("button", { name: /Continue · ₦2,500/ })).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("dragging the top card left shows a different bill title @affected", async ({ page }) => {
    const before = await topTitle(page);
    const card = page.getByTestId("swipe-card-top");
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 260, cy, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByTestId("swipe-card-top").getByRole("heading")).not.toHaveText(before);
  });

  test("custom amount above what is needed is rejected @affected", async ({ page }) => {
    await page.getByRole("button", { name: "Give", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await dialog.getByLabel("Custom amount (₦)").fill("999999999");
    await expect(dialog.getByRole("alert")).toContainText("only needs");
    await expect(dialog.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  });
});
