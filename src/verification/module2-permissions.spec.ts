import { expect, test, type APIRequestContext } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const emailA = process.env.E2E_USER_EMAIL;
const passwordA = process.env.E2E_USER_PASSWORD;
const emailB = process.env.E2E_OTHER_EMAIL;
const passwordB = process.env.E2E_OTHER_PASSWORD;

interface Session {
  access_token: string;
  user: { id: string };
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

async function signInViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<Session> {
  const response = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: publishableKey as string, "Content-Type": "application/json" },
      data: { email, password },
    },
  );
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Session;
}

test.describe("@affected @database @permissions profile rows are private per account", () => {
  test("@affected @database @permissions account B cannot read or change account A's profile row", async ({
    request,
  }) => {
    if (
      !supabaseUrl ||
      !publishableKey ||
      !emailA ||
      !passwordA ||
      !emailB ||
      !passwordB
    ) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, E2E_USER_EMAIL/E2E_USER_PASSWORD and E2E_OTHER_EMAIL/E2E_OTHER_PASSWORD are required for the two-identity permission check.",
      });
      test.skip(true, "Two disposable accounts and backend configuration are not available.");
      return;
    }

    const accountA = await signInViaApi(request, emailA, passwordA);
    const accountB = await signInViaApi(request, emailB, passwordB);
    expect(accountA.user.id).not.toBe(accountB.user.id);

    const jsonHeaders = { apikey: publishableKey, "Content-Type": "application/json" };

    // Capture account A's current value so the disposable row is restored.
    const before = await request.get(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${accountA.user.id}&select=id,full_name`,
      { headers: { apikey: publishableKey, Authorization: `Bearer ${accountA.access_token}` } },
    );
    expect(before.ok()).toBeTruthy();
    const beforeRows = (await before.json()) as ProfileRow[];
    const originalName = beforeRows[0]?.full_name ?? null;

    // Account A writes its own row through the authenticated API.
    const marker = `chief-perm-${Date.now()}`;
    const writeA = await request.post(`${supabaseUrl}/rest/v1/profiles`, {
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${accountA.access_token}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      data: { id: accountA.user.id, full_name: marker },
    });
    expect(writeA.ok()).toBeTruthy();
    const written = (await writeA.json()) as ProfileRow[];
    expect(written.filter((row) => row.id === accountA.user.id).length).toBeGreaterThan(0);

    // Account B must not be able to read account A's row.
    const readB = await request.get(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${accountA.user.id}&select=id,full_name`,
      { headers: { apikey: publishableKey, Authorization: `Bearer ${accountB.access_token}` } },
    );
    expect(readB.ok()).toBeTruthy();
    const readByB = (await readB.json()) as ProfileRow[];
    expect(readByB.filter((row) => row.id === accountA.user.id)).toEqual([]);

    // Account B must not be able to change account A's row.
    const updateB = await request.patch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${accountA.user.id}`,
      {
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${accountB.access_token}`,
          Prefer: "return=representation",
        },
        data: { full_name: "hijacked-by-account-b" },
      },
    );
    const updatedByB = updateB.ok() ? ((await updateB.json()) as ProfileRow[]) : [];
    expect(updatedByB.filter((row) => row.id === accountA.user.id)).toEqual([]);

    // Account A still reads back its own saved value.
    const readA = await request.get(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${accountA.user.id}&select=id,full_name`,
      { headers: { apikey: publishableKey, Authorization: `Bearer ${accountA.access_token}` } },
    );
    expect(readA.ok()).toBeTruthy();
    const readByA = (await readA.json()) as ProfileRow[];
    expect(readByA[0]?.full_name).toBe(marker);

    // Restore the disposable row to its previous value.
    await request.patch(`${supabaseUrl}/rest/v1/profiles?id=eq.${accountA.user.id}`, {
      headers: { ...jsonHeaders, Authorization: `Bearer ${accountA.access_token}` },
      data: { full_name: originalName },
    });
  });
});
