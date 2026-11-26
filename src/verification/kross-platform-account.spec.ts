// KROSS_PLATFORM_ACCOUNT_CONTRACT v1
import { test, expect } from '@playwright/test';
test('real sign-in, personal records and sign-out @authenticated @affected', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) throw new Error('[kross:runner] disposable account credentials unavailable');
  await page.goto("/sign-in");
  const emailField = page.locator('input[type="email"]').filter({visible:true});
  const passwordField = page.locator('input[type="password"]').filter({visible:true});
  await expect(emailField).toHaveCount(1);
  await expect(passwordField).toHaveCount(1);
  await emailField.fill(email);
  await passwordField.fill(password);
  const authResponse = page.waitForResponse(r => r.url().includes('/auth/v1/token') && r.request().method()==='POST');
  await page.getByRole('button', {name:/^(sign in|log in|login)$/i}).first().click();
  const response = await authResponse;
  expect(response.ok()).toBe(true);
  const session = await response.json();
  expect(session.user?.id).toBeTruthy();
  const revealLogout = async () => {
    const out = page.getByRole('button', {name:/sign out|log out|logout/i}).first().or(page.getByRole('link',{name:/sign out|log out|logout/i}));
    if (!(await out.isVisible())) {
      const menu = page.getByRole('button',{name:/^(open menu|toggle menu|menu|account menu|user menu)$/i}).first();
      if (await menu.count()===1) await menu.click();
    }
    await expect(out).toBeVisible();
    return out;
  };
  await revealLogout();
  await page.reload();
  const logout = await revealLogout();
  await logout.click();
  await expect(page.getByRole('button',{name:/^(sign in|log in|login)$/i}).first().or(page.getByRole('link',{name:/^(sign in|log in|login)$/i}))).toBeVisible();
});
test('invalid sign-in input is rejected without a write @affected', async ({ page }) => {
  await page.goto("/sign-in");
  let writes = 0;
  await page.route('**/*', route => {
    if (route.request().method()==='POST' && /auth\/v1\/token|rest\/v1/.test(route.request().url())) { writes++; return route.abort(); }
    return route.continue();
  });
  await page.locator('input[type="email"]').filter({visible:true}).fill('not-an-email');
  await page.getByRole('button',{name:/^(sign in|log in|login)$/i}).first().click();
  const nativeInvalid = await page.locator('input[type="email"]').filter({visible:true}).evaluate((el: HTMLInputElement)=>!el.validity.valid);
  const errorVisible = await page.getByRole('alert').filter({visible:true}).count();
  expect(nativeInvalid || errorVisible>0).toBe(true);
  expect(writes).toBe(0);
});

