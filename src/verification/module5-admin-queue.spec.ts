import { test, expect } from '@playwright/test';

test.describe('Module 5 — admin review & approval queue @affected', () => {
  test('home page links through to the review queue @affected', async ({ page }) => {
    await page.goto('/');

    const doorway = page.getByRole('link', { name: 'Admin review', exact: true }).first();
    await expect(doorway).toBeVisible();
    await doorway.click();

    await expect(page.getByRole('heading', { name: 'Bills awaiting review' })).toBeVisible();
  });

  test('pending bill cards expose approve and reject actions @affected', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Bills awaiting review' })).toBeVisible();

    const pendingCard = page.getByTestId('bill-001');
    await expect(pendingCard).toContainText('Emergency appendectomy for Ada');
    await expect(pendingCard.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(pendingCard.getByRole('button', { name: 'Reject' })).toBeVisible();
  });

  test('approving a pending bill shows Bill approved @affected', async ({ page }) => {
    await page.goto('/admin');

    const pendingCard = page.getByTestId('bill-001');
    await pendingCard.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByTestId('admin-feedback')).toContainText('Bill approved');
    await expect(pendingCard).toContainText('Approved');
  });

  test('rejecting a pending bill shows Bill rejected @affected', async ({ page }) => {
    await page.goto('/admin');

    await page.getByTestId('bill-003').getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByTestId('admin-feedback')).toContainText('Bill rejected');
  });

  test('marking a funded bill paid shows Paid out @affected', async ({ page }) => {
    await page.goto('/admin');

    const fundedCard = page.getByTestId('bill-002');
    await expect(fundedCard).toContainText('Final year tuition for Tunde');

    await fundedCard.getByRole('button', { name: 'Mark paid to biller' }).click();

    await expect(page.getByTestId('admin-feedback')).toContainText('Paid out');
    await expect(fundedCard).toContainText('Paid out');
  });

  test('a non-admin visitor sees Admins only @affected', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByText('Admins only', { exact: true })).toBeVisible();
  });
});
