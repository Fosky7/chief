import { expect, test } from "@playwright/test";

const base = process.env.E2E_USER_EMAIL;

test.describe("Module 2 — signup persistence @affected", () => {
  test("bill requester sign up writes through the UI, reads the saved value back and rejects a duplicate @affected @database @persistence", async ({
    page,
  }) => {
    if (!base || !base.includes("@")) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "E2E_USER_EMAIL is needed to derive a disposable plus-addressed sign-up email.",
      });
      test.skip(true, "Disposable sign-up email base not configured");
      return;
    }

    const [local, domain] = base.split("@");
    const email = `${local}+persist${Date.now()}@${domain}`;
    const password = "Chief-Persist-2048!";

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.getByRole("status")).toContainText("Account created", {
      timeout: 15_000,
    });

    // This value is read back from the backend after the UI write.
    await expect(page.getByTestId("signup-saved-at")).toBeVisible({ timeout: 15_000 });

    // Reload and retry: the stored row must now make the backend reject it.
    await page.reload();
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.getByRole("alert")).toContainText("already", { timeout: 15_000 });
  });
});
