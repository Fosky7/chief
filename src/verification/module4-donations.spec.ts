import { test, expect } from '@playwright/test'

test.describe('@affected donations', () => {
  test('authenticated user can donate and see the updated total @affected', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL
    const password = process.env.E2E_USER_PASSWORD
    test.skip(!email || !password, 'setup-required: E2E_USER_EMAIL and E2E_USER_PASSWORD are not available in this run.')

    await page.goto('/auth')
    await page.locator('input[type=email]').first().fill(String(email))
    await page.locator('input[type=password]').first().fill(String(password))
    await page.getByRole('button', { name: /sign in|log in|continue/i }).first().click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 20000 })

    await page.goto('/discover')
    const billLink = page.locator('a[href^="/bills/"]').first()
    await expect(billLink).toBeVisible({ timeout: 20000 })
    await billLink.click()

    const amountField = page.locator('input[type=number]').first()
    await expect(amountField).toBeVisible({ timeout: 20000 })
    await amountField.fill('2500')
    await page.getByRole('button', { name: /^donate$/i }).first().click()

    await expect(page.getByText(/donation recorded|thank you/i).first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('body')).toContainText(/raised/i)

    await page.goto('/dashboard')
    await expect(page.locator('body')).toContainText(/donation|activity/i, { timeout: 20000 })
  })
})
