import { test, expect } from '@playwright/test';

// krossbuild-write-set:
// src/verification/approved-bills.spec.ts
// supabase/functions/approved-bills/index.ts
// supabase/migrations/20261108231648_rls_policy_proof_repair.sql
// src/routes/index.tsx
// src/components/SwipeCard.tsx
// src/hooks/useBillRealtime.ts
// src/routes/discover.tsx
// src/verification/module4-discovery.spec.ts
// src/verification/module4-needed-repair.spec.ts
// Existing files must remain untouched until their current contents are available.

test('discovery exposes Needed after navigation and reload @affected', async ({ page }) => {
  await page.goto('/discover');
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByText('Needed', { exact: true }).first()).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/discover\/?(?:\?.*)?$/);
  await expect(page.getByText('Needed', { exact: true }).first()).toBeVisible();
});
