import { expect, test } from "@playwright/test";

test.describe("Module 4 — home page links into the swipe deck @affected", () => {
  test("clicking Start swiping opens a bill card showing a Needed amount @affected", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-page")).toBeVisible();

    const startSwiping = page.getByRole("link", { name: "Start swiping" });
    await expect(startSwiping).toBeVisible();
    await startSwiping.click();

    await page.waitForURL(/\/discover/);
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    // The deck must surface a "Needed" amount formatted in ₦ with grouping.
    await expect(page.getByText(/Needed/).first()).toBeVisible();
    await expect(page.getByText(/₦\s?\d{1,3}(,\d{3})+/).first()).toBeVisible();
  });

  test("clicking a featured bill card opens that bill's detail page with its title @affected", async ({
    page,
  }) => {
    await page.goto("/");

    const card = page.getByTestId("featured-bill-card").first();
    await expect(card).toBeVisible();

    const title = (await card.getByTestId("featured-bill-title").innerText()).trim();
    expect(title.length).toBeGreaterThan(0);

    await card.click();

    // The card navigates to /bills/<id> and that page shows the bill's title.
    await page.waitForURL(/\/bills\/.+/);
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
  });
});
