import { expect, test } from '@playwright/test'

test.describe('Module 4 — card amount formatting @affected', () => {
  test('top discover card shows Needed and Raised amounts in ₦ with separators @affected', async ({
    page,
  }) => {
    await page.goto('/discover')

    await expect(page.getByRole('heading', { name: 'Discover bills' })).toBeVisible()

    const card = page.getByTestId('swipe-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card.locator('img').first()).toBeVisible()
    await expect(page.getByTestId('swipe-card-title')).toBeVisible()

    const raised = page.getByTestId('swipe-card-raised')
    const goal = page.getByTestId('swipe-card-goal')

    await expect(raised).toContainText('Raised')
    await expect(raised).toContainText(/₦\d{1,3}(,\d{3})*(.\d+)?/)

    await expect(goal).toContainText('Needed')
    await expect(goal).toContainText(/₦\d{1,3}(,\d{3})*(.\d+)?/)

    await expect(card.getByRole('progressbar', { name: 'Funding progress' })).toBeVisible()
  })
})
