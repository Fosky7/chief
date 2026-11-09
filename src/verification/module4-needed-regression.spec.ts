import { test, expect } from '@playwright/test';

// krossbuild-write-set: ["src/verification/approved-bills.spec.ts", "supabase/functions/approved-bills/index.ts", "supabase/migrations/20261108231648_rls_policy_proof_repair.sql", "src/routes/index.tsx", "src/components/SwipeCard.tsx", "src/hooks/useBillRealtime.ts", "src/routes/discover.tsx", "src/verification/module4-discovery.spec.ts", "src/verification/module4-needed-regression.spec.ts"]
// Separate regression coverage preserves the existing specifications, whose
// contents were not supplied with this repair request.
test('discovery exposes the Needed label @affected', async ({ page }) => {
  await page.goto('/discover');
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByText(/^Needed\b/i).first()).toBeVisible();
});
