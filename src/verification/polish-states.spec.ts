import { test, expect } from "@playwright/test";

/**
 * Module 9 polish checks — the shared "missing page" state must render on the
 * link-safe /does-not-exist route and keep working across reload and history
 * navigation. Only this flow is exercised here; other flows keep their own spec.
 */
test.describe("polish: empty and missing states @affected", () => {
  test("missing page shows the branded not-found view", async ({ page }) => {
    await page.goto("/does-not-exist");

    const panel = page.getByTestId("not-found");
    await expect(panel).toBeVisible();

    await expect(panel.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await expect(panel.getByText("Go home", { exact: true }).first()).toBeVisible();

    // The state must survive a hard reload of the same URL.
    await page.reload();
    await expect(page.getByTestId("not-found")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("home action on the missing page navigates home and back", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page.getByTestId("not-found")).toBeVisible();

    await page.getByTestId("not-found").getByText("Go home", { exact: true }).first().click();
    await expect(page).toHaveURL(/\/(?:[?#].*)?$/);

    await page.goBack();
    await expect(page).toHaveURL(/does-not-exist/);
    await expect(page.getByTestId("not-found")).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/(?:[?#].*)?$/);
  });
});
