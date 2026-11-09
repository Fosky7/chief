import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const userA = { email: process.env.E2E_USER_EMAIL, password: process.env.E2E_USER_PASSWORD };
const userB = { email: process.env.E2E_OTHER_EMAIL, password: process.env.E2E_OTHER_PASSWORD };

const looksLikeJsonString = (v: unknown) => {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return false;
  try {
    const parsed = JSON.parse(t);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
};

test("@affected @database @persistence @permissions profile JSON fields round-trip as objects", async ({ request }) => {
  if (!supabaseUrl || !supabaseKey || !userA.email || !userA.password || !userB.email || !userB.password) {
    test.info().annotations.push({ type: "setup-required", description: "Two disposable test accounts and the backend URL/key are needed." });
    test.skip(true, "Backend configuration not provided to the runner");
    return;
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

  // No profile column may hand back a JSON document as a quoted string.
  const own = await request.get(`${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${a.user.id}`, { headers: as(a) });
  expect(own.ok()).toBeTruthy();
  const ownRows = await own.json();
  expect(ownRows.length).toBe(1);
  const row = ownRows[0] as Record<string, unknown>;
  for (const [key, value] of Object.entries(row)) {
    expect(looksLikeJsonString(value), `profiles.${key} returned a JSON string`).toBe(false);
  }

  const before = row.metadata;
  const restore = async () => {
    await request.patch(`${supabaseUrl}/rest/v1/profiles?id=eq.${a.user.id}`, {
      headers: { ...as(a), "Content-Type": "application/json" },
      data: { metadata: before && typeof before === "object" ? before : {} },
    });
  };

  try {
    // Object write reads back as an object.
    const write = await request.patch(`${supabaseUrl}/rest/v1/profiles?id=eq.${a.user.id}`, {
      headers: { ...as(a), "Content-Type": "application/json", Prefer: "return=representation" },
      data: { metadata: { krossUpdated: true } },
    });
    expect(write.ok()).toBeTruthy();
    const read = await request.get(`${supabaseUrl}/rest/v1/profiles?select=metadata&id=eq.${a.user.id}`, { headers: as(a) });
    expect((await read.json())[0].metadata).toEqual({ krossUpdated: true });

    // A JSON-encoded string '{"krossUpdated":true}' is normalised to the object too.
    const writeStr = await request.patch(`${supabaseUrl}/rest/v1/profiles?id=eq.${a.user.id}`, {
      headers: { ...as(a), "Content-Type": "application/json" },
      data: { metadata: '{"krossUpdated":true}' },
    });
    expect(writeStr.ok()).toBeTruthy();
    const readStr = await request.get(`${supabaseUrl}/rest/v1/profiles?select=metadata&id=eq.${a.user.id}`, { headers: as(a) });
    expect((await readStr.json())[0].metadata).toEqual({ krossUpdated: true });

    // Another account can neither read nor change it.
    const peek = await request.get(`${supabaseUrl}/rest/v1/profiles?select=metadata&id=eq.${a.user.id}`, { headers: as(b) });
    expect(peek.ok()).toBeTruthy();
    expect(await peek.json()).toEqual([]);

    const edit = await request.patch(`${supabaseUrl}/rest/v1/profiles?id=eq.${a.user.id}`, {
      headers: { ...as(b), "Content-Type": "application/json", Prefer: "return=representation" },
      data: { metadata: { hijacked: true } },
    });
    expect([200, 401, 403, 404]).toContain(edit.status());
    if (edit.status() === 200) expect(await edit.json()).toEqual([]);
  } finally {
    await restore();
  }
});
