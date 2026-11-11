import { test, expect, type Page } from '@playwright/test';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function futureDate(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function signInIfPrompted(page: Page, email: string, password: string) {
  const emailField = page.getByLabel(/email/i).first();
  const visible = await emailField.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) return;
  await emailField.fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.goto('/bills/new');
}

async function chooseCategory(page: Page) {
  const category = page.getByLabel('Category', { exact: false }).first();
  const tag = await category.evaluate((el) => el.tagName.toLowerCase());
  if (tag === 'select') {
    const values = await category.locator('option').evaluateAll((opts) =>
      (opts as HTMLOptionElement[]).map((o) => o.value).filter((v) => v !== ''),
    );
    await category.selectOption(values[0]);
  } else {
    await category.click();
    await page.getByRole('option').first().click();
  }
}

test.describe('Module 6: bill submission @affected', () => {
  test('shows every submission field @affected', async ({ page }) => {
    await page.goto('/bills/new');
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (email && password) await signInIfPrompted(page, email, password);
    for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test('formats the amount live in naira @affected', async ({ page }) => {
    await page.goto('/bills/new');
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (email && password) await signInIfPrompted(page, email, password);
    await page.getByLabel(/Amount/).first().fill('250000');
    await expect(page.getByText('₦250,000').first()).toBeVisible();
  });

  test('requires a title @affected', async ({ page }) => {
    await page.goto('/bills/new');
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (email && password) await signInIfPrompted(page, email, password);
    await page.getByLabel(/Amount/).first().fill('250000');
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page.getByText('Title is required').first()).toBeVisible();
  });

  test('submits a complete bill and shows pending review @affected @database @persistence', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: 'setup-required',
        description: 'E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account not supplied',
      });
      test.skip(true, 'Disposable test account not supplied by the runner');
      return;
    }
    await page.goto('/bills/new');
    await signInIfPrompted(page, email, password);

    const title = `E2E disposable bill ${Date.now()}`;
    await page.getByLabel('Title', { exact: false }).first().fill(title);
    await page
      .getByLabel('Story', { exact: false })
      .first()
      .fill('My electricity bill is overdue after a hospital stay and I need help to keep the lights on for my children.');
    await chooseCategory(page);
    await page.getByLabel('Biller name', { exact: false }).first().fill('Ikeja Electric');
    await page.getByLabel(/Amount/).first().fill('250000');
    await page.getByLabel('Due date', { exact: false }).first().fill(futureDate(45));
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: PNG_1X1,
    });
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 20000 });
  });
});
