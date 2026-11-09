import { test, expect } from '@playwright/test'

test.describe('Module 4 — Needed regression @affected', () => {
  test('home hero and Start swiping still reach the discover deck @affected', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Pay a bill with a swipe' }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Start swiping' }).click()

    await expect(page.getByRole('heading', { name: 'Discover bills' })).toBeVisible()
    await expect(page.getByTestId('discover-count')).toContainText('Needed:')
    await expect(page.getByTestId('discover-card').first()).toBeVisible()
  })

  test('signed-out nav keeps Discover, Dashboard and Sign in @affected', async ({ page }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link', { name: 'Discover', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0)
  })

  test('category filter narrows the deck and All restores it @affected', async ({ page }) => {
    await page.goto('/discover')

    const cards = page.getByTestId('discover-card')
    const total = await cards.count()

    await page.getByRole('button', { name: 'Education', exact: true }).click()

    await expect(cards).toHaveCount(1)
    await expect(page.getByText('Safe Schools Initiative')).toBeVisible()

    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(cards).toHaveCount(total)
  })

  test('discover page keeps the brand shell around the deck @affected', async ({ page }) => {
    await page.goto('/discover')

    await expect(page.getByRole('link', { name: 'Chief home' })).toBeVisible()
    await expect(page.getByTestId('footer-brand')).toBeVisible()
    await expect(page.getByTestId('discover-page')).toBeVisible()
  })
})
