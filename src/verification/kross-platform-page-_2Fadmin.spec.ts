// KROSS_PLATFORM_PAGE_CONTRACT v1
import { test, expect, type Page } from '@playwright/test';
// Pages finish loading data, sign-in checks and redirects after the first paint.
// Every reading waits until the address and main headings stop changing, and
// every comparison retries, so a reading taken mid-load can never fail the app.
const headings = (p: Page) => p.getByRole('heading', { level: 1 }).allTextContents().catch(() => [] as string[]);
async function settle(p: Page) {
  await p.waitForLoadState('load').catch(() => {});
  let last = '', same = 0;
  for (let i = 0; i < 50 && same < 3; i++) {
    const snap = p.url() + '\n' + (await headings(p)).join('\u0000');
    if (snap === last) same++; else { same = 0; last = snap; }
    await p.waitForTimeout(200);
  }
}
const SETTLE = { timeout: 10_000 };
test("page /admin refresh and navigation @affected", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto("/admin");
  await expect(page.locator('body')).not.toBeEmpty();
  await settle(page);
  const destination = page.url();
  const title = await page.title();
  const heading = await headings(page);
  const links = await page.getByRole('navigation').getByRole('link').evaluateAll(els => els.filter(e=>e instanceof HTMLAnchorElement).map(e=>({href:(e as HTMLAnchorElement).getAttribute('href'),text:e.textContent?.trim()})));
  for (const target of links) {
    if (!target.href?.startsWith('/') || target.href.startsWith('//')) continue;
    // Compare control-driven content to its canonical URL, not just URL movement.
    const canonical = await page.context().newPage();
    await canonical.goto(target.href);
    await settle(canonical);
    const expectedUrl = canonical.url();
    const expected = await headings(canonical);
    await canonical.close();
    const link = page.getByRole('navigation').getByRole('link',{name:target.text || '',exact:true}).filter({visible:true});
    if (await link.count() !== 1) continue;
    await link.click();
    await expect(page).toHaveURL(expectedUrl, SETTLE);
    await expect.poll(() => headings(page), SETTLE).toEqual(expected);
    await page.goto(destination);
    await settle(page);
  }
  // Back/forward needs a different address: opening the page you are already on
  // replaces that history entry instead of adding one (the home page itself).
  await page.goto(new URL(destination).pathname === '/' ? '/?kross-history-check=1' : '/');
  await settle(page);
  const away = page.url();
  if (away !== destination) {
    await page.goBack();
    await expect(page).toHaveURL(destination, SETTLE);
    await expect.poll(() => headings(page), SETTLE).toEqual(heading);
    await page.goForward();
    await expect(page).toHaveURL(away, SETTLE);
    await page.goBack();
    await expect(page).toHaveURL(destination, SETTLE);
  } else await page.goto(destination);
  await page.reload();
  await expect(page).toHaveURL(destination, SETTLE);
  await expect(page).toHaveTitle(title, SETTLE);
  await expect(page.locator('body')).not.toBeEmpty();
  await expect.poll(() => headings(page), SETTLE).toEqual(heading);
  expect(errors).toEqual([]);
});
