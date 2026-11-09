import { test, expect } from '@playwright/test'

test.describe('@affected discover visibility', () => {
  test('discover renders needed bills visibly', async ({ page }) => {
    await page.goto('/discover')

    await expect(page.getByTestId('discover-page')).toBeVisible()
    await expect(page.getByTestId('discover-deck')).toBeVisible()
    await expect(page.getByTestId('discover-card').first()).toBeVisible()
    await expect(page.getByTestId('discover-count')).toContainText('Needed:')
  })
})
