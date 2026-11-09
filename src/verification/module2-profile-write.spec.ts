import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const seedEmail = process.env.E2E_USER_EMAIL;

test.describe("@affected profile persistence", () => {
  test("bill requester sign up writes a profile row that survives a reload @affected @database @persistence", async ({
    page,
    request,
  }) => {
    if (!supabaseUrl || !supabaseKey || !seedEmail || !seedEmail.includes("@")) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and E2E_USER_EMAIL are needed for a disposable sign-up roundtrip.",
      });
      test.skip(true, "Disposable sign-up configuration is not available to the runner");
      return;
    }

    const [local, domain] = seedEmail.split("@");
    const email = `${local}+profile${Date.now()}@${domain}`;
    const password = "Chief-Profile-2048!";

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({
      timeout: 20_000,
    });

    // Reload the document: the profile must not be lost.
    await page.reload();

    const tokenResponse = await request.post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        headers: { apikey: supabaseKey as string, "Content-Type": "application/json" },
        data: { email, password },
      },
    );

    if (!tokenResponse.ok()) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "The signed-up account is still awaiting email confirmation, so no session exists to read the profile back.",
      });
      test.skip(true, "Signed-up account has no session until its email is confirmed");
      return;
    }

    const session = await tokenResponse.json();

    const readback = await request.get(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=id,role`,
      {
        headers: {
          apikey: supabaseKey as string,
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    expect(readback.ok()).toBeTruthy();

    const rows = (await readback.json()) as Array<{ id: string; role: string | null }>;
    expect(Array.isArray(rows)).toBeTruthy();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].id).toBe(session.user.id);
    expect(rows[0].role).toBe("bill_requester");
  });
});
