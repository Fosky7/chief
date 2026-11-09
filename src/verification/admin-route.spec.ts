import { test, expect } from "@playwright/test";

// Flow: direct load of the admin review route.
// Step 5 acceptance: loading /admin directly shows the "Bills awaiting review"
// heading (with the pending bill queue rendered beneath it).
test("loading /admin directly shows the Bills awaiting review heading @affected @admin", async ({
  page,
}) => {
  await page.goto("/admin");

  const heading = page.getByRole("heading", { name: /bills awaiting review/i });
  await expect(heading).toBeVisible({ timeout: 20000 });

  // The queue region must resolve out of its loading state (either pending
  // bill cards or a truthful empty-state message is rendered).
  await expect(page.getByText(/pending review|no bills awaiting review/i).first()).toBeVisible({
    timeout: 20000,
  });
});
