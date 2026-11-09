import { test, expect } from '@playwright/test';
test('real requester signup persists profile and survives fresh login @affected @database @persistence', async ({ page, request }) => {
 const email = 'chief-proof-' + crypto.randomUUID() + '@example.com'; const password = crypto.randomUUID() + 'Aa9!';
 const url = process.env.VITE_SUPABASE_URL; const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if (!url || !key) throw new Error('Connected backend required');
 await page.goto('/auth'); await page.getByRole('button', { name: 'Create an account', exact: true }).click();
 await page.getByLabel('Email', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
 await page.getByRole('radio', { name: 'Bill requester', exact: true }).check(); await page.getByRole('button', { name: 'Create account', exact: true }).click();
 await expect(page.getByRole('status').filter({ hasText: 'Account created' })).toBeVisible();
 const login = await request.post(url + '/auth/v1/token?grant_type=password', { headers: { apikey: key }, data: { email, password } }); expect(login.ok()).toBe(true);
 const session = await login.json();
 const read = await request.get(url + '/rest/v1/profiles?id=eq.' + session.user.id + '&select=id,email,role', { headers: { apikey: key, Authorization: 'Bearer ' + session.access_token } });
 expect(read.ok()).toBe(true); const rows = await read.json(); expect(rows).toHaveLength(1); expect(rows[0].email).toBe(email); expect(rows[0].role).toBe('bill_requester');
 await page.goto('/dashboard'); await page.reload(); await expect(page.getByRole('heading', { name: 'Your dashboard', exact: true })).toBeVisible();
});