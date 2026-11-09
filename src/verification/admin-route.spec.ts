import { test, expect } from "@playwright/test";

/**
 * Module 5 - step 5: the "/admin" route must be registered so that loading the
 * address directly renders the admin review & approval queue.
 *
 * Flow: sign in through the real UI with the disposable E2E account, then
 * navigate straight to "/admin" and assert the queue heading plus a pending
 * bill card are rendered (no 404 / not-found page).
 */
const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;

test.describe("@affected admin review route", () => {
  test("loading /admin directly shows the Bills awaiting review heading with a pending bill card", async ({
    page,
  }) => {
    test.skip(
      !userEmail || !userPassword,
      "E2E_USER_EMAIL / E2E_USER_PASSWORD are not available for this run",
    );

    // Sign in through the canonical /auth page using the real UI.
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.getByLabel("Email").fill(userEmail!);
    await page.getByLabel("Password").fill(userPassword!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
      timeout: 30_000,
    });

    // Load the admin address directly (deep link, not an in-app click).
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);

    // The route must resolve to the admin review page, not the not-found page.
    await expect(page.getByText("Page not found")).toHaveCount(0);

    const queueHeading = page.getByRole("heading", { name: "Bills awaiting review" });
    const adminGate = page.getByRole("heading", { name: "Admins only" });

    await expect(
      page.getByRole("heading", { name: /Bills awaiting review|Admins only/ }),
    ).toBeVisible({ timeout: 15_000 });

    if (await adminGate.isVisible()) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "The disposable E2E account is not an admin, and granting the admin role is not a consented, non-destructive action for this run. An admin-role disposable account is required to assert the pending review queue.",
      });
      test.skip(true, "Needs an admin-role disposable account (setup-required).");
    }

    // Heading rendered by src/routes/admin.tsx.
    await expect(queueHeading).toBeVisible();

    // At least one pending bill card is part of the queue, exposing its decisions.
    await expect(page.getByText("Pending review").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" }).first()).toBeVisible();
  });
});
