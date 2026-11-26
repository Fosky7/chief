import { test, expect } from "@playwright/test";

/**
 * Module 9 — home entry links.
 *
 * Flow A: "Discover bills" on / opens the real /discover page.
 * Flow B: "Dashboard" on / opens the real /dashboard page.
 *
 * Both are navigation flows, so each one also exercises back, forward and a
 * hard reload. Assertions use the destinations' real, visible states (the
 * discover page's loading / exhausted states and the dashboard's heading or
 * its "No bills yet" empty state) rather than assuming seeded rows exist.
 */

const isHome = (url: URL) => url.pathname === "/";
const isDiscover = (url: URL) => url.pathname === "/discover";
const isDashboard = (url: URL) => url.pathname === "/dashboard";

test.describe("home entry links", () => {
  test("home \"Discover bills\" link opens /discover and survives back, forward and reload @affected", async ({
    page,
  }) => {
    await page.goto("/");

    const discoverLink = page.getByTestId("home-discover-bills-link");
    await expect(discoverLink).toBeVisible();
    await expect(discoverLink).toContainText("Discover bills");

    await discoverLink.click();
    await expect(page).toHaveURL(isDiscover);

    // The discover page is real data: it either shows its loading state while
    // bills load or its "seen every bill" exhausted state when nothing is left.
    await expect(
      page
        .getByText(/loading bills/i)
        .or(page.getByText(/seen every bill/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.goBack();
    await expect(page).toHaveURL(isHome);
    await expect(page.getByTestId("home-discover-bills-link")).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(isDiscover);

    await page.reload();
    await expect(page).toHaveURL(isDiscover);
    await expect(
      page
        .getByText(/loading bills/i)
        .or(page.getByText(/seen every bill/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("home \"Dashboard\" link opens /dashboard and survives back, forward and reload @affected", async ({
    page,
  }) => {
    await page.goto("/");

    const dashboardLink = page.getByTestId("home-dashboard-entry-link");
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toContainText("Dashboard");

    await dashboardLink.click();
    await expect(page).toHaveURL(isDashboard);

    // The dashboard renders for a signed-out visitor as well as for an account
    // with no bills: accept either its heading landmark or the "No bills yet"
    // empty state, whichever the connected backend really produces.
    await expect(
      page
        .getByRole("heading", { name: /dashboard/i })
        .first()
        .or(page.getByText(/no bills yet/i).first()),
    ).toBeVisible({ timeout: 20_000 });

    await page.goBack();
    await expect(page).toHaveURL(isHome);
    await expect(page.getByTestId("home-dashboard-entry-link")).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(isDashboard);

    await page.reload();
    await expect(page).toHaveURL(isDashboard);
    await expect(
      page
        .getByRole("heading", { name: /dashboard/i })
        .first()
        .or(page.getByText(/no bills yet/i).first()),
    ).toBeVisible({ timeout: 20_000 });
  });
});
