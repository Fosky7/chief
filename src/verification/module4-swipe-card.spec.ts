import { expect, test } from "@playwright/test";

test.describe("Module 4 — swipe card @affected", () => {
  test("top card shows photo, title, Needed, Raised and progress bar @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/discover");
    const card = page.getByTestId("bill-card").first();
    await expect(card).toBeVisible();

    await expect(card.getByTestId("bill-photo")).toBeVisible();
    const title = card.getByTestId("bill-title");
    await expect(title).toBeVisible();
    expect(((await title.textContent()) ?? "").trim().length).toBeGreaterThan(3);

    await expect(card).toContainText("Needed");
    await expect(card).toContainText("Raised");
    await expect(card.getByTestId("bill-needed")).toHaveText(/^₦\d{1,3}(,\d{3})+$/);
    await expect(card.getByTestId("bill-raised")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);

    const bar = card.getByRole("progressbar");
    await expect(bar).toBeVisible();
    const now = Number(await bar.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);

    expect(errors).toEqual([]);
  });
});
