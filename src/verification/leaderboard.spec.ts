import { test, expect } from "@playwright/test";

test.describe("@affected leaderboard", () => {
  test("leaderboard page shows the ranked top givers or its real empty state", async ({ page }) => {
    await page.goto("/leaderboard");

    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeVisible();
    await expect(
      page.getByText("The top 100 givers, ranked by the total amount they have donated to bills on Chief."),
    ).toBeVisible();

    // Wait for the live read to settle (loading skeleton disappears).
    await expect(page.getByTestId("leaderboard-loading")).toHaveCount(0, { timeout: 20_000 });

    const list = page.getByTestId("leaderboard-list");

    if ((await list.count()) > 0) {
      const rows = list.getByRole("listitem");
      await expect(rows.first()).toBeVisible();

      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
      expect(rowCount).toBeLessThanOrEqual(100);

      // Rank 1 is rendered first and carries a Naira total.
      const first = page.getByTestId("leaderboard-row-1");
      await expect(first).toBeVisible();
      await expect(first.getByLabel("Rank 1")).toBeVisible();
      await expect(first).toContainText("₦");

      // Totals must never increase as the ranking goes down.
      const amounts = await list
        .getByRole("listitem")
        .evaluateAll((items) =>
          items.map((item) => {
            const totalText = item.querySelector(".leaderboard-total")?.textContent ?? "";
            return Number(totalText.replace(/[^0-9.]/g, "")) || 0;
          }),
        );

      for (let index = 1; index < amounts.length; index += 1) {
        expect(amounts[index]).toBeLessThanOrEqual(amounts[index - 1]);
      }
    } else {
      // Fresh backend: the honest empty state must be visible instead of rows.
      await expect(page.getByTestId("leaderboard-empty")).toBeVisible();
      await expect(page.getByText("No givers yet")).toBeVisible();
    }
  });

  test("leaderboard page declares its own sharing details @affected", async ({ page }) => {
    await page.goto("/leaderboard");

    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeVisible();

    // The leaderboard must not reuse the home page's title or description.
    await expect(page).toHaveTitle("Top givers leaderboard — Chief");
    await expect(page.locator('meta[name="description"]').first()).toHaveAttribute(
      "content",
      /top 100 givers/,
    );
    await expect(page.locator('meta[property="og:title"]').first()).toHaveAttribute(
      "content",
      "Top givers leaderboard — Chief",
    );
    await expect(page.locator('meta[property="og:description"]').first()).toHaveAttribute(
      "content",
      /top 100 givers/,
    );
    await expect(page.locator('meta[property="og:type"]').first()).toHaveAttribute("content", "website");
    await expect(page.locator('meta[name="twitter:card"]').first()).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  test("leaderboard page survives refresh, back and forward navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();

    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeVisible();
  });
});
