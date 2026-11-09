import { test, expect } from '@playwright/test'

test.describe('Module 4 — Needed is visible on Discover @affected', () => {
  test('discover shows the Needed count, search and bill cards @affected', async ({ page }) => {
    await page.goto('/discover')

    await expect(page.getByRole('heading', { name: 'Discover bills' })).toBeVisible()
    await expect(page.getByTestId('discover-count')).toContainText('Needed:')
    await expect(page.getByTestId('discover-search')).toBeVisible()
    await expect(page.getByText('Swipe through bills that need your voice.')).toBeVisible()

    const cards = page.getByTestId('discover-card')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('searching filters the discover deck @affected', async ({ page }) => {
    await page.goto('/discover')

    const cards = page.getByTestId('discover-card')
    const total = await cards.count()
    expect(total).toBeGreaterThan(1)

    await page.getByTestId('discover-search').fill('water')

    await expect(cards).toHaveCount(1)
    await expect(page.getByText('Clean Water Access')).toBeVisible()
    await expect(page.getByTestId('discover-count')).toContainText('Needed: 1')

    await page.getByTestId('discover-search').fill('')
    await expect(cards).toHaveCount(total)
  })

  test('no-match search shows the empty message @affected', async ({ page }) => {
    await page.goto('/discover')

    await page.getByTestId('discover-search').fill('zzz-no-such-bill')

    await expect(page.getByTestId('discover-card')).toHaveCount(0)
    await expect(page.getByText('No bills match your search yet.')).toBeVisible()
  })
})
