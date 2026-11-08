import { expect, test } from "@playwright/test";

test.describe("Module 4 — home links to discovery deck @affected", () => {
  test("clicking Start discovering opens /discover with a bill card showing Needed @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    const cta = page
      .getByRole("link", { name: "Start discovering" })
      .or(page.getByRole("button", { name: "Start discovering" }))
      .first();
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/discover(\?|#|$)/);
    const card = page.getByTestId("bill-card").first();
    await expect(card).toBeVisible();
    await expect(card).toContainText("Needed");
    await expect(card.getByTestId("bill-needed")).toHaveText(/^₦\d{1,3}(,\d{3})+$/);

    expect(errors).toEqual([]);
  });
});
