import { test, expect } from "@playwright/test";

test.describe("Module 4 discover deck controls @affected", () => {
  test("clicking Skip shows the next bill card @affected", async ({ page }) => {
    await page.goto("/discover");
    const title = page.getByTestId("swipe-card-title");
    await expect(title).toBeVisible();
    const first = ((await title.textContent()) ?? "").trim();
    expect(first.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Skip", exact: true }).click();

    await expect(title).toBeVisible();
    await expect(title).not.toHaveText(first);
  });

  test("clicking Give opens Choose an amount and selecting updates the button @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByTestId("swipe-card-title")).toBeVisible();

    await page.getByRole("button", { name: "Give", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Choose an amount" })).toBeVisible();

    const preset = dialog.getByRole("button", { name: "₦5,000" });
    await preset.click();
    await expect(preset).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("button", { name: "Give ₦5,000" })).toBeEnabled();

    await dialog.getByLabel("Or enter your own amount").fill("2500");
    await expect(dialog.getByRole("button", { name: "Give ₦2,500" })).toBeEnabled();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
