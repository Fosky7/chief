import { test, expect } from '@playwright/test'

test.describe('@affected inner pages', () => {
  test('home page renders without a blank screen @affected', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toHaveText('')
  })

  test('discover page renders bills or a clear empty state @affected', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.getByRole('heading', { name: /discover bills/i })).toBeVisible({ timeout: 20000 })
    const billOrEmpty = page.locator('a[href^="/bills/"]').first().or(page.getByText(/no bills found/i).first())
    await expect(billOrEmpty).toBeVisible({ timeout: 20000 })
  })

  test('dashboard renders account or sign-in guidance @affected', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /your dashboard/i })).toBeVisible({ timeout: 20000 })
    const accountOrSignIn = page.getByText(/signed in as/i).first().or(page.getByRole('link', { name: /sign in/i }).first())
    await expect(accountOrSignIn).toBeVisible({ timeout: 20000 })
  })

  test('admin page renders the review queue or admins-only guard @affected', async ({ page }) => {
    await page.goto('/admin')
    const queueOrGuard = page.getByRole('heading', { name: /bills awaiting review/i }).first().or(page.getByRole('heading', { name: /admins only/i }).first())
    await expect(queueOrGuard).toBeVisible({ timeout: 20000 })
  })
})
