import { expect, test, type Locator, type Page } from "@playwright/test";

/** Opens /discover and clicks the first "Give" action to reveal the sheet. */
async function openGivingSheet(page: Page): Promise<Locator> {
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

  const give = page.getByRole("button", { name: "Give", exact: true }).first();
  await expect(give).toBeVisible();
  await give.click();

  const sheet = page.getByTestId("amount-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
}

test.describe("Module 4 — giving sheet @affected", () => {
  test("clicking Give on /discover opens the Choose an amount panel @affected", async ({ page }) => {
    const sheet = await openGivingSheet(page);

    await expect(sheet.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
    await expect(sheet.getByTestId("amount-input")).toBeVisible();
  });

  test("typing an amount in the panel keeps the entered value visible @affected", async ({
    page,
  }) => {
    const sheet = await openGivingSheet(page);
    const amountInput = sheet.getByLabel("Amount (₦)");

    await expect(amountInput).toBeVisible();
    await amountInput.fill("7500");

    await expect(amountInput).toHaveValue("7500");
    await expect(sheet.getByTestId("amount-summary")).toContainText("₦7,500");

    // The typed value survives further interaction with the panel.
    await amountInput.click();
    await expect(amountInput).toHaveValue("7500");
  });

  test("choosing a preset fills the amount and can be replaced by a typed value @affected", async ({
    page,
  }) => {
    const sheet = await openGivingSheet(page);
    const amountInput = sheet.getByLabel("Amount (₦)");

    await sheet.getByTestId("amount-preset-5000").click();
    await expect(amountInput).toHaveValue("5000");
    await expect(sheet.getByTestId("amount-summary")).toContainText("₦5,000");

    await amountInput.fill("12000");
    await expect(amountInput).toHaveValue("12000");
    await expect(sheet.getByTestId("amount-summary")).toContainText("₦12,000");
  });
});
