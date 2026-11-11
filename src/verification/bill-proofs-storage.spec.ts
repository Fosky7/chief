import { test, expect } from "@playwright/test";

// 1x1 transparent PNG used as a disposable proof file.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

test("proof upload is stored in the bill-proofs bucket and bill shows Pending review @affected @database @persistence", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    test.info().annotations.push({
      type: "setup-required",
      description: "E2E_USER_EMAIL/E2E_USER_PASSWORD disposable account not supplied",
    });
    test.skip(true, "Disposable test account not supplied by the runner");
    return;
  }

  await page.goto("/auth");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto("/bills/new");
  const title = `E2E proof bill ${Date.now()}`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Story", { exact: true }).fill("Disposable verification bill for the proof storage bucket check.");
  const category = page.getByLabel("Category", { exact: true });
  const tag = await category.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "select") await category.selectOption("Health");
  else await category.fill("Health");
  await page.getByLabel("Biller name", { exact: true }).fill("Lagos University Teaching Hospital");
  await page.getByLabel("Amount (₦)", { exact: true }).fill("25000");
  await page.getByLabel("Due date", { exact: true }).fill("2030-01-15");
  await page.getByLabel("Proof of bill", { exact: true }).setInputFiles({
    name: "proof.png",
    mimeType: "image/png",
    buffer: PNG,
  });

  const uploadResponse = page.waitForResponse(
    (res) => res.url().includes("/storage/v1/object/bill-proofs/") && res.request().method() === "POST",
    { timeout: 20_000 },
  );
  await page.locator('form button[type="submit"]').first().click();
  const res = await uploadResponse;
  expect(res.status(), "proof upload into bill-proofs should succeed").toBeLessThan(300);
  await expect(page.getByText("Pending review").first()).toBeVisible({ timeout: 20_000 });
});
