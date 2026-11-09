import { test, expect } from "@playwright/test";

/**
 * Module 4 repair checks — the deck entry point from the home page and the
 * account-creation persistence flow (UI write → full reload → backend readback).
 * These drive the real UI only: no mocks, no storage shortcuts.
 */
test.describe("Module 4 repair — deck entry point and saved account @affected", () => {
  test("home page exposes exactly one Discover link and it opens the swipe deck @affected", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /pay a bill with a swipe/i }),
    ).toBeVisible();

    // Exactly one control named "Discover" must be resolvable on the page, so
    // accessibility-based lookup is unambiguous at this viewport.
    const discover = page.getByRole("link", { name: "Discover", exact: true });
    await expect(discover).toHaveCount(1);
    await expect(discover).toBeVisible();

    await discover.click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId("swipe-deck")).toBeVisible();
    await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  });

  test("phone viewport still has one visible Discover link into the deck @affected", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const discover = page.getByRole("link", { name: "Discover", exact: true });
    await expect(discover).toHaveCount(1);
    await expect(discover).toBeVisible();

    await discover.click();
    await expect(page.getByTestId("swipe-deck")).toBeVisible();
    await expect(page.getByTestId("top-bill-title")).toHaveText(/\S+/);
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  });

  test("bill requester sign-up writes, fully reloads and re-reads the saved account @affected @database @persistence", async ({
    page,
  }) => {
    let navigations = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations += 1;
    });

    const email = `chief.persistence.${Date.now()}@mailinator.com`;

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Chief-Persist-Pass-2024!");
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.getByRole("status")).toHaveText("Account created", { timeout: 20000 });

    // The page must perform a real full reload after the database write.
    await expect.poll(() => navigations, { timeout: 20000 }).toBeGreaterThanOrEqual(2);

    // After the reload the confirmation is still shown and the saved role is
    // read back from the backend (or the email-confirmation hint is shown).
    await expect(page.getByRole("status")).toHaveText("Account created", { timeout: 20000 });
    await expect(
      page.getByText(/Saved account role: Bill requester|Check your inbox to confirm your email/),
    ).toBeVisible({ timeout: 20000 });
  });
});
