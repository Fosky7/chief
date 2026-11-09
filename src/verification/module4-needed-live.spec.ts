import { test, expect } from '@playwright/test'

test.describe('@affected discover live filtering', () => {
  test('search filters discover cards', async ({ page }) => {
    await page.goto('/discover')

    await expect(page.getByTestId('discover-card')).toHaveCount(3)

    await page.getByTestId('discover-search').fill('health')

    await expect(page.getByTestId('discover-card')).toHaveCount(1)
    await expect(page.getByTestId('discover-card')).toContainText('Primary Healthcare Fund')
    await expect(page.getByTestId('discover-count')).toContainText('Needed: 1')
  })

  test('category chip filters discover cards', async ({ page }) => {
    await page.goto('/discover')

    await expect(page.getByTestId('discover-card')).toHaveCount(3)

    await page.getByRole('button', { name: 'Education', exact: true }).click()

    await expect(page.getByTestId('discover-card')).toHaveCount(1)
    await expect(page.getByTestId('discover-card')).toContainText('Safe Schools Initiative')
    await expect(page.getByTestId('discover-count')).toContainText('Needed: 1')
  })

  test('discover still renders its deck at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/discover')

    await expect(page.getByTestId('discover-page')).toBeVisible()
    await expect(page.getByTestId('discover-deck')).toBeVisible()
    await expect(page.getByTestId('discover-card')).toHaveCount(3)
    await expect(page.getByTestId('discover-count')).toContainText('Needed: 3')

    await page.getByTestId('discover-search').fill('water')
    await expect(page.getByTestId('discover-card')).toHaveCount(1)
    await expect(page.getByTestId('discover-card')).toContainText('Clean Water Access')
  })
})
