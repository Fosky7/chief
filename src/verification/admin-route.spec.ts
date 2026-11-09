import { test, expect } from '@playwright/test';

/**
 * Module 5 / plan step 5 — the /admin address must be registered in the
 * TanStack file-based route tree, so loading it directly renders the admin
 * review page (queue for admins, gate for everyone else) instead of a
 * not-found screen.
 */
test('@affected loading /admin directly renders the admin review page', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });

  // The address itself must resolve to /admin (no redirect to a 404 page).
  await expect(page).toHaveURL(/\/admin$/);

  const heading = page.getByRole('heading', { name: /Bills awaiting review/i });
  const gate = page.getByText(/Admins only/i);

  // Either the queue (admin session) or the admin gate (guest / non-admin)
  // must be visible — both prove the route is registered and rendering.
  await expect(heading.or(gate).first()).toBeVisible({ timeout: 20000 });

  // The page must settle out of its loading state.
  await expect(page.getByText(/Loading review queue/i)).toHaveCount(0, { timeout: 20000 });
});
