import { expect, test } from '@playwright/test'

test.describe('Module 4 — swipe deck @affected', () => {
  test('Skip shows the next bill card @affected', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.getByRole('heading', { name: 'Discover bills' })).toBeVisible()

    const title = page.getByTestId('swipe-card-title')
    await expect(title).toBeVisible({ timeout: 15_000 })
    const first = (await title.textContent())?.trim() ?? ''
    expect(first.length).toBeGreaterThan(0)

    await page.getByTestId('swipe-skip').click()

    await expect(page.getByTestId('swipe-card-title')).not.toHaveText(first)
    await expect(page.getByTestId('swipe-card-title')).toBeVisible()
  })

  test('Give opens the Choose an amount sheet @affected', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.getByTestId('swipe-card')).toBeVisible({ timeout: 15_000 })

    await page.getByTestId('swipe-support').click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Choose an amount' })).toBeVisible()
  })

  test('dragging the top card left shows the next bill card @affected', async ({ page }) => {
    await page.goto('/discover')
    const card = page.getByTestId('swipe-card')
    await expect(card).toBeVisible({ timeout: 15_000 })

    const title = page.getByTestId('swipe-card-title')
    const first = (await title.textContent())?.trim() ?? ''
    expect(first.length).toBeGreaterThan(0)

    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return

    const startX = box.x + box.width / 2
    const y = box.y + box.height / 2

    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(startX - 200, y, { steps: 12 })
    await page.mouse.up()

    await expect(page.getByTestId('swipe-card-title')).not.toHaveText(first)
  })
})
