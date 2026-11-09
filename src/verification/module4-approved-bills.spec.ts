import { test, expect } from "@playwright/test";

const NAIRA_AMOUNT = /^₦\d{1,3}(,\d{3})*$/;

test.describe("Module 4 — approved bills feed the discovery deck @affected", () => {
  test("top bill card shows a Needed amount and a Raised amount @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
    await expect(card.getByText("Raised", { exact: true })).toBeVisible();

    await expect(page.getByTestId("top-bill-needed")).toHaveText(NAIRA_AMOUNT);
    await expect(page.getByTestId("top-bill-raised")).toHaveText(NAIRA_AMOUNT);
  });

  test("top bill card always renders a photo and a title @affected", async ({ page }) => {
    await page.goto("/discover");

    const card = page.getByTestId("top-bill-card");
    await expect(card).toBeVisible();

    const photo = card.locator("img").first();
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute("src", /^https?:\/\/.+/);

    await expect(card.getByRole("heading", { level: 2 })).toHaveText(/\S+/);
  });

  test("top bill card keeps the published bills list reachable @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByTestId("top-bill-card")).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the full story" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Back home" })).toBeVisible();
  });
});
