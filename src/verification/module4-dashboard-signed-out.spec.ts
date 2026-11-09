import { expect, test } from "@playwright/test";

test.describe("Module 4 repair — signed-out dashboard @affected", () => {
  test("signed-out /dashboard shows Dashboard heading and a Sign in link @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

    const signIn = page.getByRole("link", { name: "Sign in" }).first();
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute("href", /\/auth/);

    expect(errors).toEqual([]);
  });

  test("signed-out nav shows Sign in and no Sign out @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByText("Sign in", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign out" })).toHaveCount(0);
  });
});
