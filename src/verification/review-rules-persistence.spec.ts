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

/**
 * Review-rule columns (rejection_reason, rejected_at, resubmission_count,
 * last_resubmitted_at, proof_files) are added by
 * supabase/migrations/20261123000000_review_rules.sql.
 *
 * This test saves a bill through the real /bills/new page and reads the row
 * back, so the database change is proven end to end instead of only by DDL:
 *   - a fresh bill stores zero resubmissions and no rejection reason,
 *   - all proof files reach the jsonb `proof_files` column,
 *   - the owner dashboard reads the same saved bill back.
 */
test("saved bill reads back with review-rule columns (resubmission_count 0, no rejection reason, proof_files array) @affected @database @persistence", async ({
  page,
}) => {
  if (!EMAIL || !PASSWORD || !SUPABASE_URL || !SUPABASE_KEY) {
    test.info().annotations.push({
      type: "setup-required",
      description:
        "E2E_USER_EMAIL/E2E_USER_PASSWORD and VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY must be supplied.",
    });
    test.skip(true, "Disposable account or backend configuration not supplied");
    return;
  }

  const title = `E2E review-rules bill ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await page.goto("/auth");
  await krossRevealHeaderControls(page);
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // Save through the page: two proof files so the multi-file column is proven.
  await page.goto("/bills/new");
  await krossRevealHeaderControls(page);
  await page.locator("#bill-title").fill(title);
  await page.locator("#bill-story").fill("Disposable bill proving the review-rule columns round-trip.");
  await page.locator("#bill-category").selectOption("Electricity");
  await page.locator("#bill-biller").fill("Ikeja Electric");
  await page.locator("#bill-amount").fill("7500");
  await page.locator("#bill-due").fill("2030-01-01");
  await page.locator("#bill-proof").setInputFiles([
    { name: "proof-a.png", mimeType: "image/png", buffer: PNG },
    { name: "proof-b.png", mimeType: "image/png", buffer: PNG },
  ]);
  await expect(page.getByTestId("proof-selected")).toHaveCount(2);

  const insertResponse = page.waitForResponse(
    (r) => r.url().includes("/rest/v1/bills") && r.request().method() === "POST" && r.status() < 300,
    { timeout: 45_000 },
  );
  await page.getByRole("button", { name: "Submit bill" }).click();
  const resp = await insertResponse;
  const authHeader = resp.request().headers()["authorization"];
  await expect(page.getByTestId("bill-pending")).toBeVisible({ timeout: 15_000 });

  // Read the saved row back from the backend.
  const headers = { apikey: SUPABASE_KEY, Authorization: authHeader ?? `Bearer ${SUPABASE_KEY}` };
  const readUrl = `${SUPABASE_URL}/rest/v1/bills?title=eq.${encodeURIComponent(title)}&select=*`;
  const read = await page.request.get(readUrl, { headers });
  expect(read.ok()).toBeTruthy();
  const rows = (await read.json()) as Array<Record<string, unknown>>;
  expect(rows.length).toBe(1);

  const row = rows[0];
  expect(row.title).toBe(title);
  expect(String(row.status)).toBe("pending");
  // Fresh bills carry the documented defaults of the review rules.
  expect(Number(row.resubmission_count)).toBe(0);
  expect(row.rejection_reason ?? null).toBeNull();
  expect(row.rejected_at ?? null).toBeNull();
  expect(row.last_resubmitted_at ?? null).toBeNull();
  // Both files reached the jsonb proof_files column.
  const proofFiles = row.proof_files;
  expect(Array.isArray(proofFiles)).toBeTruthy();
  const stored = (proofFiles as Array<Record<string, unknown>>) ?? [];
  expect(stored.length).toBe(2);
  for (const file of stored) {
    expect(typeof file.url).toBe("string");
    expect(String(file.url).length).toBeGreaterThan(0);
  }

  // Read it back through the app too: the owner dashboard shows the same bill.
  await page.goto("/dashboard");
  await krossRevealHeaderControls(page);
  await page.reload();
  await krossRevealHeaderControls(page);
  await expect(page.getByRole("heading", { name: "Your dashboard" })).toBeVisible({ timeout: 15_000 });
  const dashboardRow = page.getByTestId("dashboard-bill").filter({ hasText: title });
  await expect(dashboardRow).toBeVisible({ timeout: 15_000 });
  await expect(dashboardRow.getByTestId("bill-status")).toHaveText("Pending review");

  // Remove only the disposable record this test created (RLS may block; ignore).
  await page.request
    .delete(`${SUPABASE_URL}/rest/v1/bills?title=eq.${encodeURIComponent(title)}`, { headers })
    .catch(() => undefined);
});
