import { expect, test } from "@playwright/test";

for (const size of [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
]) {
  test(`@affected /discover renders the swipe deck at ${size.name} width`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("/discover");
    await expect(page.getByText("Needed").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}
