import { test, expect } from "@playwright/test";

/**
 * Flow: branded page-not-found view reachable at /does-not-exist.
 * The route must render the not-found landmark, its "Page not found" heading and
 * a "Back to home" action that really navigates back to the home page.
 */
test("@affected page-not-found route shows the branded view and returns home", async ({ page }) => {
  await page.goto("/does-not-exist");

  const view = page.getByTestId("not-found");
  await expect(view).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found", level: 1 })).toBeVisible();

  const backToHome = page
    .getByRole("link", { name: "Back to home" })
    .or(page.getByRole("button", { name: "Back to home" }));
  await expect(backToHome).toBeVisible();

  await backToHome.click();
  await expect(page).toHaveURL(/\/(?:[?#].*)?$/);
  await expect(page.locator("h1").first()).toBeVisible();

  // Browser history must keep the branded view reachable going back/forward.
  await page.goBack();
  await expect(page.getByTestId("not-found")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found", level: 1 })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/\/(?:[?#].*)?$/);

  // A hard refresh of the not-found URL still renders the branded view.
  await page.goto("/does-not-exist");
  await page.reload();
  await expect(page.getByTestId("not-found")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found", level: 1 })).toBeVisible();
});
