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
})
