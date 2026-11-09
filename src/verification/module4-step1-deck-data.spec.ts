import { test, expect } from "@playwright/test";

const NAIRA_WITH_SEPARATORS = /₦\d{1,3}(,\d{3})+/;

test.describe("Module 4 step 1 — deck data and naira formatting @affected", () => {
  test("/discover deck shows a bill card with a Needed amount @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByText("Loading bills…")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("deck-empty")).toHaveCount(0);
    await expect(page.getByText(/Needed/).first()).toBeVisible();
  });

  test("/discover top card shows naira with thousands separators @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText(/Needed/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(NAIRA_WITH_SEPARATORS).first()).toBeVisible();
  });

  test("/discover falls back to sample bills when the backend is unreachable @affected", async ({ page }) => {
    await page.route("**/rest/v1/bills**", (route) => route.abort());
    await page.goto("/discover");
    await expect(page.getByText(/Needed/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(NAIRA_WITH_SEPARATORS).first()).toBeVisible();
    await expect(page.getByTestId("deck-progress")).not.toHaveText(/of 0$/);
  });
});
