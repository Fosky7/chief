import { test, expect } from "@playwright/test";
async function krossRevealHeaderControls(page: any) { // kross-reveal-v3
  const toggle = page.getByRole('button', { name: /open menu|toggle menu|navigation menu|main menu|account menu|user menu|menu/i }).filter({ visible: true }).first();
  // The control may render after navigation; wait for it instead of skipping the menu.
  await toggle.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined);
  if (!(await toggle.isVisible().catch(() => false))) return;
  await page.waitForLoadState('networkidle').catch(() => undefined);
  for (let i = 0; i < 4; i++) {
    const state = await toggle.getAttribute('aria-expanded').catch(() => null);
    if (state === 'true' || state === null && i > 0) return;
    await toggle.click().catch(() => undefined);
    await page.waitForTimeout(300 * (i + 1));
  }
}


const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

// 1x1 transparent PNG used as disposable proof of bill.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("submitted bill persists and appears on the dashboard after reload @affected @database @persistence", async ({ page }) => {
  if (!EMAIL || !PASSWORD || !SUPABASE_URL || !SUPABASE_KEY) {
    test.info().annotations.push({
      type: "setup-required",
      description: "E2E_USER_EMAIL/E2E_USER_PASSWORD and VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY must be supplied.",
    });
    test.skip(true, "Disposable account or backend configuration not supplied");
    return;
  }

  const title = `E2E disposable bill ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await page.goto("/auth");
  await krossRevealHeaderControls(page);
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto("/bills/new");
  await krossRevealHeaderControls(page);
  await page.locator("#bill-title").fill(title);
  await page.locator("#bill-story").fill("Disposable verification bill created by an automated test.");
  await page.locator("#bill-category").selectOption("Electricity");
  await page.locator("#bill-biller").fill("Ikeja Electric");
  await page.locator("#bill-amount").fill("5000");
  await page.locator("#bill-due").fill("2030-01-01");
  await page.locator("#bill-proof").setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: PNG });

  const insertResponse = page.waitForResponse(
    (r) => r.url().includes("/rest/v1/bills") && r.request().method() === "POST" && r.status() < 300,
    { timeout: 45_000 },
  );
  await page.getByRole("button", { name: "Submit bill" }).click();
  const resp = await insertResponse;
  const authHeader = resp.request().headers()["authorization"];
  await expect(page.getByTestId("bill-pending")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("bill-pending")).toContainText("Pending review");

  // Reload the owner dashboard and assert the saved bill is visible.
  await page.goto("/dashboard");
  await krossRevealHeaderControls(page);
  await page.reload();
  await krossRevealHeaderControls(page);
  await expect(page.getByRole("heading", { name: "Your dashboard" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("bills-loading")).toHaveCount(0, { timeout: 15_000 });
  const row = page.getByTestId("dashboard-bill").filter({ hasText: title });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByTestId("bill-status")).toHaveText("Pending review");

  // Independent backend readback of the exact owner record.
  const headers = { apikey: SUPABASE_KEY, Authorization: authHeader ?? `Bearer ${SUPABASE_KEY}` };
  const readUrl = `${SUPABASE_URL}/rest/v1/bills?title=eq.${encodeURIComponent(title)}&select=*`;
  const read = await page.request.get(readUrl, { headers });
  expect(read.ok()).toBeTruthy();
  const rows = (await read.json()) as Array<Record<string, unknown>>;
  expect(rows.length).toBe(1);
  expect(rows[0].title).toBe(title);
  expect(String(rows[0].status)).toBe("pending");

  // Cleanup only the record created by this test (may be blocked by RLS; ignore).
  await page.request
    .delete(`${SUPABASE_URL}/rest/v1/bills?title=eq.${encodeURIComponent(title)}`, { headers })
    .catch(() => undefined);
});
