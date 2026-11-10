import { test, expect } from "@playwright/test";

/**
 * Header logo flow.
 *
 * The real check reported that no logo could be found in the header/top bar at
 * phone width on the home page, and that /auth could not be inspected at all.
 * Both pages are rendered inside the shared app shell, so this test walks the
 * affected pages at phone and desktop widths and asserts a real <header>
 * containing the Chief logo (svg with an aria-label mentioning "logo"),
 * including after a hard reload so the shell is proven to render on a fresh
 * server response as well as on client-side navigation.
 */
test.describe("Header brand logo @affected", () => {
  test("header shows the Chief logo on / and /auth at phone and desktop widths @affected", async ({
    page,
  }) => {
    const viewports = [
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const path of ["/", "/auth"]) {
        await page.goto(path, { waitUntil: "load" });

        const header = page.locator("header").first();
        await expect(header).toBeVisible();

        const logo = header.getByTestId("chief-logo").first();
        await expect(logo).toBeVisible();
        await expect(logo).toHaveAttribute("aria-label", /logo/i);

        // The brand doorway remains usable next to the logo.
        await expect(header.getByTestId("brand-link")).toBeVisible();
      }
    }

    // A hard reload must still render the shared header with its logo.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "load" });
    await page.reload({ waitUntil: "load" });
    const reloadedHeader = page.locator("header").first();
    await expect(reloadedHeader).toBeVisible();
    await expect(reloadedHeader.getByTestId("chief-logo").first()).toBeVisible();

    // The Admin doorway in the header navigates to the review queue.
    await page.getByTestId("nav-admin").click();
    await expect(page).toHaveURL(/\/admin$/);
  });
});
