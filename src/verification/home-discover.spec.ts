import { test, expect } from "@playwright/test";

/**
 * Home page doorway into the swipe deck.
 *
 * Flow: on "/" the visitor clicks "Discover bills" and lands on the swipe deck
 * at "/discover", which must present the Skip control of the live deck.
 */
test("Home: the Discover bills doorway opens the swipe deck showing a Skip button @affected", async ({
  page,
}) => {
  await page.goto("/");

  const doorway = page.getByRole("link", { name: "Discover bills" });
  await expect(doorway).toBeVisible();

  await doorway.click();

  // Navigation actually happened (not a no-op click).
  await expect(page).toHaveURL(/\/discover\/?$/);

  // The real swipe deck is rendered with an actionable Skip button.
  await expect(page.getByTestId("swipe-card-top")).toBeVisible();

  const skip = page.getByRole("button", { name: "Skip" });
  await expect(skip).toBeVisible();
  await expect(skip).toBeEnabled();

  // And the deck responds: skipping shows a different bill (or the empty state).
  const position = page.getByTestId("deck-position");
  await expect(position).toBeVisible();
  const beforePosition = (await position.innerText()).trim();
  const beforeTitle = (
    await page.getByTestId("swipe-card-top").getByRole("heading", { level: 2 }).innerText()
  ).trim();

  await skip.click();

  await expect(position).not.toHaveText(beforePosition);
  const nextTop = page.getByTestId("swipe-card-top");
  if ((await nextTop.count()) > 0) {
    await expect(nextTop.getByRole("heading", { level: 2 })).not.toHaveText(beforeTitle);
  } else {
    await expect(page.getByTestId("deck-empty")).toBeVisible();
  }
});
