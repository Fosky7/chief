import { test, expect, type Page } from "@playwright/test";

/**
 * Module 5 — moderation actions on /admin.
 *
 * These flows act on bills that already exist in the connected backend, so they
 * are tagged @real-account: execution pauses for run-scoped permission rather
 * than mutating someone else's submission without consent. Each test performs
 * the real click through the UI and asserts the concrete outcome message plus
 * the disappearance of the moderated bill from its section.
 */

const REVIEW_HEADING = "Bills awaiting review";

function skipForSetup(description: string) {
  test.info().annotations.push({ type: "setup-required", description });
  test.skip(true, description);
}

async function signInAsDisposableUser(page: Page): Promise<boolean> {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    skipForSetup(
      "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account required to open the /admin workspace.",
    );
    return false;
  }

  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible({ timeout: 20_000 });

  return true;
}

/** Load /admin and wait until either the gate or the real queue is on screen. */
async function openQueue(page: Page): Promise<"gate" | "queue"> {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible();

  const gate = page.getByTestId("admin-gate");
  const queueSection = page.getByRole("heading", { name: "Awaiting review" });
  await expect(gate.or(queueSection)).toBeVisible({ timeout: 25_000 });

  return (await gate.isVisible()) ? "gate" : "queue";
}

test.describe("Module 5 — admin moderation actions @affected", () => {
  test("approving a pending bill reports Bill approved @affected @real-account", async ({ page }) => {
    const signedIn = await signInAsDisposableUser(page);
    if (!signedIn) return;

    if ((await openQueue(page)) === "gate") {
      skipForSetup(
        "An admin-role disposable account is required to exercise the approval queue; the supplied account is gated.",
      );
      return;
    }

    const card = page.getByTestId("admin-queue-card").first();
    if ((await card.count()) === 0) {
      skipForSetup("At least one bill awaiting review is required to perform an approval.");
      return;
    }

    const title = (await card.locator("h3").first().innerText()).trim();
    await card.getByRole("button", { name: "Approve", exact: true }).click();

    const message = page.getByTestId("admin-action-message");
    await expect(message).toBeVisible({ timeout: 20_000 });
    await expect(message).toContainText("Bill approved");

    await expect(
      page.getByTestId("admin-queue-card").filter({ hasText: title }),
    ).toHaveCount(0, { timeout: 20_000 });
  });

  test("rejecting a pending bill reports Bill rejected @affected @real-account", async ({ page }) => {
    const signedIn = await signInAsDisposableUser(page);
    if (!signedIn) return;

    if ((await openQueue(page)) === "gate") {
      skipForSetup(
        "An admin-role disposable account is required to exercise the rejection queue; the supplied account is gated.",
      );
      return;
    }

    const card = page.getByTestId("admin-queue-card").first();
    if ((await card.count()) === 0) {
      skipForSetup("At least one bill awaiting review is required to perform a rejection.");
      return;
    }

    const title = (await card.locator("h3").first().innerText()).trim();
    await card.getByRole("button", { name: "Reject", exact: true }).click();

    const message = page.getByTestId("admin-action-message");
    await expect(message).toBeVisible({ timeout: 20_000 });
    await expect(message).toContainText("Bill rejected");

    await expect(
      page.getByTestId("admin-queue-card").filter({ hasText: title }),
    ).toHaveCount(0, { timeout: 20_000 });
  });

  test("marking a funded bill paid reports Paid out @affected @real-account", async ({ page }) => {
    const signedIn = await signInAsDisposableUser(page);
    if (!signedIn) return;

    if ((await openQueue(page)) === "gate") {
      skipForSetup(
        "An admin-role disposable account is required to exercise the payout queue; the supplied account is gated.",
      );
      return;
    }

    const fundedCard = page.getByTestId("admin-funded-card").first();
    if ((await fundedCard.count()) === 0) {
      skipForSetup("A funded bill awaiting payout is required to perform a payout.");
      return;
    }

    const title = (await fundedCard.locator("h3").first().innerText()).trim();
    await fundedCard.getByRole("button", { name: "Mark paid to biller", exact: true }).click();

    const message = page.getByTestId("admin-action-message");
    await expect(message).toBeVisible({ timeout: 20_000 });
    await expect(message).toContainText("Paid out");

    await expect(
      page.getByTestId("admin-funded-card").filter({ hasText: title }),
    ).toHaveCount(0, { timeout: 20_000 });
  });
});
