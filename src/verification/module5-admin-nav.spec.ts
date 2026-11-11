import { expect, test } from "@playwright/test";

test.describe("Module 5 — Admin doorway in navigation @affected", () => {
  test("clicking Admin in the nav opens the admin page @affected", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    const adminLink = nav.getByRole("link", { name: "Admin", exact: true });
    await expect(adminLink).toBeVisible();
    await adminLink.click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin|Bills awaiting review/ }),
    ).toBeVisible();
    // Existing nav entries remain intact.
    await expect(nav.getByRole("link", { name: "Discover", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  });
});
