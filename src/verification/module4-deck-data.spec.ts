import { expect, test } from "@playwright/test";

test.describe("Module 4 — deck data @affected", () => {
  test("discover shows a bill card with Needed and Naira-formatted amounts @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/discover");
    const card = page.getByTestId("bill-card").first();
    await expect(card).toBeVisible();
    await expect(card).toContainText("Needed");
    await expect(card).toContainText("Raised");

    await expect(card.getByTestId("bill-needed")).toHaveText(/^₦\d{1,3}(,\d{3})+$/);
    await expect(card.getByTestId("bill-raised")).toHaveText(/^₦\d/);

    expect(errors).toEqual([]);
  });
});
