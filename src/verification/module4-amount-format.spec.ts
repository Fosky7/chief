import { test, expect } from "@playwright/test";

test.describe("Module 4 — approved bills feed & ₦ formatting @affected", () => {
  test("discover renders the deck and the Needed count @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("discover-page")).toBeVisible();
    await expect(page.getByText(/Needed/).first()).toBeVisible();
  });

  test("discover shows bill amounts with the ₦ symbol and thousands separators @affected", async ({
    page,
  }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    // At least one amount on the deck must be rendered as ₦ + grouped digits.
    const formattedAmount = page.getByText(/₦\s?\d{1,3}(,\d{3})+/).first();
    await expect(formattedAmount).toBeVisible();

    const text = (await formattedAmount.innerText()).trim();
    expect(text).toMatch(/₦\d{1,3}(,\d{3})+/);

    // A raw, ungrouped Naira figure (e.g. ₦480000) must never reach the deck.
    expect(text).not.toMatch(/₦\d{4,}/);
  });
});
