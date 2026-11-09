import { test, expect } from "@playwright/test";

test.describe("Swipe deck interactions @affected", () => {
  test("pass and back advance the deck @affected", async ({ page }) => {
    await page.goto("/discover");
    const progress = page.getByTestId("deck-progress");
    await expect(progress).toContainText("1 of");
    const firstTitle = await page.getByTestId("swipe-card").locator("h2").innerText();

    await page.getByRole("button", { name: "Pass" }).click();
    await expect(progress).toContainText("2 of");
    await expect(page.getByTestId("swipe-card").locator("h2")).not.toHaveText(firstTitle);
    await expect(page.getByTestId("backed-count")).toHaveText("Backed: 0");

    await page.getByRole("button", { name: "Back this bill" }).click();
    await expect(page.getByTestId("backed-count")).toHaveText("Backed: 1");
  });
});
