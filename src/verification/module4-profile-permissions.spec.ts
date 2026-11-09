import { test, expect } from '@playwright/test';

test('@affected @database @permissions separate accounts cannot read or change another profile', async ({ page, request }) => {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const emailA = process.env.E2E_USER_EMAIL;
  const passwordA = process.env.E2E_USER_PASSWORD;
  const emailB = process.env.E2E_OTHER_EMAIL;
  const passwordB = process.env.E2E_OTHER_PASSWORD;

  if (!url || !key || !emailA || !passwordA || !emailB || !passwordB) {
    test.info().annotations.push({
      type: 'setup-required',
      description: 'Connected backend configuration and two different disposable account credentials are required for permissions verification.',
    });
    test.skip(true, 'Two-account backend verification is not configured.');
    return;
  }

  async function authenticate(email: string, password: string) {
    const response = await request.post(`${url}/auth/v1/token?grant_type=password`, {
      headers: { apikey: key!, 'Content-Type': 'application/json' },
      data: { email, password },
    });
    expect(response.ok(), 'Disposable account must authenticate successfully').toBeTruthy();
    const session = await response.json();
    expect(typeof session.access_token).toBe('string');
    expect(typeof session.user?.id).toBe('string');
    return session as { access_token: string; user: { id: string } };
  }

  const a = await authenticate(emailA, passwordA);
  const b = await authenticate(emailB, passwordB);
  expect(a.user.id, 'Permissions checks require separate identities').not.toBe(b.user.id);

  const headersA = { apikey: key, Authorization: `Bearer ${a.access_token}` };
  const headersB = { apikey: key, Authorization: `Bearer ${b.access_token}` };
  const profileUrl = `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(a.user.id)}&select=id,role,full_name,avatar_url,city`;

  // Establish a real, readable owner row before testing isolation. An empty
  // fixture must fail rather than making the negative checks pass vacuously.
  const ownRead = await request.get(profileUrl, { headers: headersA });
  expect(ownRead.ok()).toBeTruthy();
  const original = await ownRead.json();
  expect(original).toHaveLength(1);
  expect(original[0].id).toBe(a.user.id);

  // Exercise the actual application authentication path as well as the two
  // independently authenticated REST identities. No session is injected.
  await page.goto('/auth');
  await page.getByLabel('Email', { exact: true }).fill(emailA);
  await page.getByLabel('Password', { exact: true }).fill(passwordA);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();

  const foreignRead = await request.get(profileUrl, { headers: headersB });
  expect(foreignRead.ok()).toBeTruthy();
  expect(await foreignRead.json()).toEqual([]);

  // Submit the existing value so even a broken policy cannot alter a
  // pre-existing disposable account's data. return=representation still
  // reveals an unauthorized matched UPDATE, which must fail this test.
  const foreignUpdate = await request.patch(profileUrl, {
    headers: { ...headersB, Prefer: 'return=representation' },
    data: { full_name: original[0].full_name },
  });
  if (foreignUpdate.ok()) {
    expect(await foreignUpdate.json(), 'Account B must not update any of A\'s rows').toEqual([]);
  } else {
    expect([401, 403]).toContain(foreignUpdate.status());
  }

  const ownerReadback = await request.get(profileUrl, { headers: headersA });
  expect(ownerReadback.ok()).toBeTruthy();
  expect(await ownerReadback.json()).toEqual(original);
});
