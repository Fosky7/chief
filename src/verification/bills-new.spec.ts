import { test, expect } from "@playwright/test";

test.describe("/bills/new submission form @affected", () => {
  test("shows fields, formats naira and validates title @affected", async ({ page }) => {
    await page.goto("/bills/new");

    for (const label of ["Title", "Story", "Category", "Biller name", "Amount (₦)", "Due date", "Proof of bill"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }

    const amount = page.getByLabel(/Amount \(₦\)/).first();
    await amount.fill("250000");
    await expect
      .poll(async () => {
        const v = await amount.inputValue();
        if (v.includes("250,000")) return true;
        return (await page.getByText("₦250,000").count()) > 0;
      })
      .toBe(true);

    await page.getByRole("button", { name: /submit/i }).first().click();
    await expect(page.getByText("Title is required").first()).toBeVisible();
  });
});
