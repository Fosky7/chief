import { test, expect } from "@playwright/test";

/**
 * @affected @database @permissions
 *
 * Two separate disposable identities (account A: E2E_USER_EMAIL /
 * E2E_USER_PASSWORD, account B: E2E_OTHER_EMAIL / E2E_OTHER_PASSWORD) sign in
 * through the real UI in separate browser contexts. B must not be able to read
 * or change A's profiles row. All calls use the connected publishable backend
 * configuration; no service-role key is ever used.
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const aEmail = process.env.E2E_USER_EMAIL;
const aPassword = process.env.E2E_USER_PASSWORD;
const bEmail = process.env.E2E_OTHER_EMAIL;
const bPassword = process.env.E2E_OTHER_PASSWORD;

function apiHeaders(token: string) {
  return {
    apikey: supabaseKey as string,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

test("@affected @database @permissions second account cannot read or change the first account's profile", async ({
  page,
  browser,
  request,
}) => {
  if (!supabaseUrl || !supabaseKey || !aEmail || !aPassword || !bEmail || !bPassword) {
    test.info().annotations.push({
      type: "setup-required",
      description:
        "Backend URL/key plus two disposable accounts (E2E_USER_EMAIL/E2E_USER_PASSWORD and E2E_OTHER_EMAIL/E2E_OTHER_PASSWORD) are required for the permissions flow.",
    });
    test.skip(true, "Two disposable accounts and backend configuration are not available to the runner");
    return;
  }

  // ---- Account A signs in through the real UI -------------------------
  await page.goto("/auth");
  await page.getByLabel("Email", { exact: true }).fill(aEmail);
  await page.getByLabel("Password", { exact: true }).fill(aPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }).or(page.getByRole("link", { name: "Sign out", exact: true })).first(),
  ).toBeVisible({ timeout: 15_000 });

  // ---- Account B signs in through the real UI in its own context ------
  const origin = new URL(page.url()).origin;
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  try {
    await pageB.goto(`${origin}/auth`);
    await pageB.getByLabel("Email", { exact: true }).fill(bEmail);
    await pageB.getByLabel("Password", { exact: true }).fill(bPassword);
    await pageB.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      pageB.getByRole("button", { name: "Sign out", exact: true }).or(pageB.getByRole("link", { name: "Sign out", exact: true })).first(),
    ).toBeVisible({ timeout: 15_000 });
  } finally {
    await contextB.close();
  }

  // ---- Fetch tokens for both identities -------------------------------
  async function token(email: string, password: string) {
    const res = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: supabaseKey as string, "Content-Type": "application/json" },
      data: { email, password },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return { token: body.access_token as string, id: body.user.id as string };
  }

  const a = await token(aEmail, aPassword);
  const b = await token(bEmail, bPassword);
  expect(a.id).not.toEqual(b.id);

  // ---- A writes its own row (a real backend write it can read back) ---
  const marker = `perm-${Date.now()}`;
  const aWrite = await request.post(`${supabaseUrl}/rest/v1/profiles`, {
    headers: { ...apiHeaders(a.token), Prefer: "resolution=merge-duplicates,return=representation" },
    data: { id: a.id, role: "bill_requester", city: marker },
  });
  expect(aWrite.ok()).toBeTruthy();

  const aRead = await request.get(
    `${supabaseUrl}/rest/v1/profiles?select=id,city&id=eq.${a.id}`,
    { headers: apiHeaders(a.token) },
  );
  expect(aRead.ok()).toBeTruthy();
  const aRows = await aRead.json();
  expect(Array.isArray(aRows)).toBeTruthy();
  expect(aRows.length).toBe(1);
  expect(aRows[0].city).toBe(marker);

  // ---- B must not be able to read A's row -----------------------------
  const bRead = await request.get(
    `${supabaseUrl}/rest/v1/profiles?select=id,city&id=eq.${a.id}`,
    { headers: apiHeaders(b.token) },
  );
  expect(bRead.ok()).toBeTruthy();
  const bRows = await bRead.json();
  expect(Array.isArray(bRows)).toBeTruthy();
  expect(bRows.length).toBe(0);

  // ---- B must not be able to change A's row ---------------------------
  const bWrite = await request.patch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${a.id}`,
    {
      headers: { ...apiHeaders(b.token), Prefer: "return=representation" },
      data: { city: "hijacked-by-other-account" },
    },
  );
  if (bWrite.ok()) {
    const changed = await bWrite.json();
    expect(Array.isArray(changed) ? changed.length : 0).toBe(0);
  }

  // ---- A's saved value is unchanged after B's attempt -----------------
  const aReadback = await request.get(
    `${supabaseUrl}/rest/v1/profiles?select=id,city&id=eq.${a.id}`,
    { headers: apiHeaders(a.token) },
  );
  expect(aReadback.ok()).toBeTruthy();
  const readbackRows = await aReadback.json();
  expect(readbackRows.length).toBe(1);
  expect(readbackRows[0].city).toBe(marker);
});
