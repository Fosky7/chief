import { test, expect } from '@playwright/test'

test.describe('@affected discover responsive regression', () => {
  test('discover stacks cleanly at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/discover')

    const page_ = page.getByTestId('discover-page')
    await expect(page_).toBeVisible()

    const box = await page_.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeLessThanOrEqual(375)

    const cards = page.getByTestId('discover-card')
    await expect(cards).toHaveCount(3)

    const first = await cards.nth(0).boundingBox()
    const second = await cards.nth(1).boundingBox()
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    // Stacked vertically, aligned to the same left edge.
    expect(second!.y).toBeGreaterThan(first!.y)
    expect(Math.abs(second!.x - first!.x)).toBeLessThan(2)
  })

  test('discover uses its wide multi-column layout at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/discover')

    const cards = page.getByTestId('discover-card')
    await expect(cards).toHaveCount(3)

    const first = await cards.nth(0).boundingBox()
    const second = await cards.nth(1).boundingBox()
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    // Cards sit side by side instead of a single narrow column.
    expect(second!.x).toBeGreaterThan(first!.x)
    expect(Math.abs(second!.y - first!.y)).toBeLessThan(2)
  })

  test('home keeps the hero and its calls to action', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'Pay a bill with a swipe' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start swiping' })).toBeVisible()
    await expect(page.getByTestId('brand-link')).toBeVisible()
    await expect(page.getByText('SwifePay')).toHaveCount(0)
  })
})
