import { test, expect } from '@playwright/test';

test('discovery loads its live endpoint and supports browser preflight @affected', async ({ page, request }) => {
  const responsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith('/functions/v1/approved-bills') && response.request().method() === 'POST',
    { timeout: 30000 },
  );
  await page.goto('/');
  await page.getByRole('link', { name: 'Start swiping', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Discover bills', exact: true })).toBeVisible();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()['access-control-allow-origin']).toBe('*');
  const body = await response.json();
  expect(Array.isArray(body.bills)).toBe(true);
  expect(body.error).toBeUndefined();

  const preflight = await request.options(response.url(), {
    headers: {
      Origin: new URL(page.url()).origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info',
    },
  });
  expect(preflight.ok()).toBeTruthy();
  expect(preflight.headers()['access-control-allow-origin']).toBe('*');
  expect(preflight.headers()['access-control-allow-methods']).toContain('POST');
  expect(preflight.headers()['access-control-allow-headers']).toContain('apikey');

  const card = page.getByTestId('swipe-card');
  await expect(card).toBeVisible();
  const title = await card.getByRole('heading', { level: 2 }).innerText();
  await card.getByRole('button', { name: 'Give', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Choose an amount', exact: true })).toBeVisible();
  await expect(dialog.getByText(title, { exact: true })).toBeVisible();
});
