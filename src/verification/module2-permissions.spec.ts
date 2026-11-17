import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const userA = { email: process.env.E2E_USER_EMAIL, password: process.env.E2E_USER_PASSWORD };
const userB = { email: process.env.E2E_OTHER_EMAIL, password: process.env.E2E_OTHER_PASSWORD };

test("@affected @database @permissions one account cannot read or change another account's profile", async ({ request }) => {
  if (!supabaseUrl || !supabaseKey || !userA.email || !userA.password || !userB.email || !userB.password) {
    test.info().annotations.push({ type: "setup-required", description: "Two disposable test accounts and the backend URL/key are needed." });
    test.skip(true, "Backend configuration not provided to the runner");
  }
  const signIn = async (u: { email?: string; password?: string }) => {
    const r = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: supabaseKey!, "Content-Type": "application/json" },
      data: { email: u.email, password: u.password },
    });
    expect(r.ok()).toBeTruthy();
    return r.json();
  };
  const a = await signIn(userA);
  const b = await signIn(userB);
  expect(a.user.id).not.toBe(b.user.id);
  const as = (s: any) => ({ apikey: supabaseKey!, Authorization: `Bearer ${s.access_token}` });

  // Each account may read its own profile row.
  const own = await request.get(`${supabaseUrl}/rest/v1/profiles?select=id&id=eq.${a.user.id}`, { headers: as(a) });
  expect(own.ok()).toBeTruthy();

  // Account B must not see account A's profile.
  const peek = await request.get(`${supabaseUrl}/rest/v1/profiles?select=id,full_name&id=eq.${a.user.id}`, { headers: as(b) });
  expect(peek.ok()).toBeTruthy();
  expect(await peek.json()).toEqual([]);

  // Account B must not be able to change account A's profile.
  const edit = await request.patch(`${supabaseUrl}/rest/v1/profiles?id=eq.${a.user.id}`, {
    headers: { ...as(b), "Content-Type": "application/json", Prefer: "return=representation" },
    data: { full_name: "changed by someone else" },
  });
  expect([200, 401, 403, 404]).toContain(edit.status());
  if (edit.status() === 200) expect(await edit.json()).toEqual([]);
});
