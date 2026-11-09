import { test, expect } from '@playwright/test'

test.describe('@affected discover responsive regression', () => {
  test('discover keeps its phone-width layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/discover')

    const main = page.getByTestId('discover-page')
    await expect(main).toBeVisible()

    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeLessThanOrEqual(448)

    const cards = page.getByTestId('discover-card')
    await expect(cards).toHaveCount(3)

    const first = await cards.nth(0).boundingBox()
    const second = await cards.nth(1).boundingBox()
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(second!.y).toBeGreaterThan(first!.y)
  })
})
