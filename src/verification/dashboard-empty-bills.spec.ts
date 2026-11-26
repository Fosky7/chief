import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// This spec runs in Playwright's Node process, outside the app's browser types.
declare const process: { env: Record<string, string | undefined> };

type Bill = { id: string; title: string; requester_id?: string | null; user_id?: string | null };

test('dashboard signs in and matches real owner bills after reload @affected @database', async ({ page, request }) => {
  test.setTimeout(60_000);
  const email = process.env['E2E_USER_EMAIL'];
  const password = process.env['E2E_USER_PASSWORD'];
  const backend = process.env['VITE_SUPABASE_URL'];
  const key = process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ?? process.env['VITE_SUPABASE_ANON_KEY'];
  if (!email || !password || !backend || !key) {
    test.info().annotations.push({ type: 'setup-required', description: 'Disposable account and publishable backend configuration are required for the dashboard check.' });
    test.skip(true, 'Dashboard check requires the runner-provided account and backend');
    return;
  }

  await test.step('Open dashboard and follow its sign-in action', async () => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Your dashboard', exact: true })).toBeVisible();
    const signedOut = page.getByTestId('dashboard-signed-out');
    await expect(signedOut).toBeVisible();
    await signedOut.getByRole('link', { name: 'Sign in to continue', exact: true }).click();
    await expect(page).toHaveURL(/\/auth(?:[?#].*)?$/);
  });

  const session = await test.step('Sign in through the form and verify the server-authenticated identity', async () => {
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    const responsePromise = page.waitForResponse(response => response.url().startsWith(backend + '/auth/v1/token') && response.request().method() === 'POST', { timeout: 12_000 });
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const response = await responsePromise;
    expect(response.ok(), 'The sign-in request must succeed before opening the dashboard').toBe(true);
    const data = await response.json() as { access_token?: string; user?: { id?: string } };
    if (!data.access_token || !data.user?.id) throw new Error('The sign-in response did not contain an authenticated account');
    const headers = { apikey: key, Authorization: `Bearer ${data.access_token}` };
    const identity = await request.get(backend + '/auth/v1/user', { headers, timeout: 10_000 });
    expect(identity.ok(), 'The backend must recognize the signed-in account').toBe(true);
    expect((await identity.json() as { id: string }).id).toBe(data.user.id);
    // Wait only for this app's session persistence; no global network-idle or
    // hidden header menu is involved. Tokens never leave the browser test.
    await expect.poll(() => page.evaluate((id: string) => {
      for (let i = 0; i < localStorage.length; i++) {
        const name = localStorage.key(i);
        if (!name?.startsWith('sb-') || !name.endsWith('-auth-token')) continue;
        try { if (JSON.parse(localStorage.getItem(name) || '{}').user?.id === id) return true; } catch { /* not a session */ }
      }
      return false;
    }, data.user?.id ?? ''), { timeout: 5_000, message: 'The form must persist its signed-in session before navigation' }).toBe(true);
    return { id: data.user.id, headers };
  });

  async function readOwnerBills(client: APIRequestContext): Promise<Bill[]> {
    const read = await client.get(backend + '/rest/v1/bills?select=*', { headers: session.headers, timeout: 10_000 });
    expect(read.ok(), 'Real bills must be readable as the signed-in account').toBe(true);
    const rows: unknown = await read.json();
    if (!Array.isArray(rows)) throw new Error('The bills endpoint did not return a list');
    return (rows as Bill[]).filter(row => (row.requester_id ?? row.user_id) === session.id);
  }

  async function checkDashboard(view: Page, reload: boolean) {
    const loaded = view.waitForResponse(response => response.url().startsWith(backend + '/rest/v1/bills?') && response.request().method() === 'GET', { timeout: 12_000 });
    if (reload) await view.reload({ waitUntil: 'domcontentloaded' });
    else await view.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    expect((await loaded).ok(), 'The dashboard must finish its real bills request').toBe(true);
    await expect(view.getByRole('heading', { name: 'Your dashboard', exact: true })).toBeVisible();
    await expect(view.getByText(`Signed in as ${email}`, { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(view.getByTestId('dashboard-loading')).toHaveCount(0);
    await expect(view.getByTestId('dashboard-error')).toHaveCount(0);
    await expect(view.getByTestId('dashboard-signed-out')).toHaveCount(0);

    const bills = await readOwnerBills(request);
    const rows = view.getByTestId('dashboard-bill');
    await expect(rows, 'Rendered bills must match the actual owner-scoped backend records').toHaveCount(bills.length);
    if (bills.length === 0) {
      const empty = view.getByTestId('bills-empty');
      await expect(empty).toBeVisible();
      await expect(empty.getByTestId('bills-empty-title')).toHaveText('No bills yet');
      await expect(empty.getByRole('link', { name: 'Post a bill', exact: true })).toHaveAttribute('href', '/bills/new');
    } else {
      await expect(view.getByTestId('bills-empty')).toHaveCount(0);
      const renderedTitles = await rows.getByRole('heading').allTextContents();
      expect(renderedTitles.map(title => title.trim()).sort(), 'Every rendered title must belong to a real bill owned by this account').toEqual(bills.map(bill => bill.title.trim()).sort());
    }
    test.info().annotations.push({ type: 'kross-dashboard-read-proof', description: JSON.stringify({ reload, ownerMatched: true, backendBills: bills.length, renderedBills: await rows.count() }) });
  }

  await test.step('Verify dashboard bills against independent backend readback', () => checkDashboard(page, false));
  await test.step('Reload dashboard and verify the same real-data behavior', () => checkDashboard(page, true));
});