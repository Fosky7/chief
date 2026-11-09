import { test, expect, type Page } from "@playwright/test";

const DISCOVER_PATH = "/discover";

/** The deck must always present a top card to interact with. */
async function openTopCard(page: Page) {
  await page.goto(DISCOVER_PATH);
  const card = page.getByTestId("swipe-card-top");
  await expect(card).toBeVisible();
  return card;
}

/** Asserts the naira symbol and (for amounts of 1000+) thousands separators. */
function expectNairaAmount(text: string) {
  expect(text, "naira amounts must start with the ₦ symbol").toMatch(/^₦[0-9,]+$/);
  const digits = text.replace(/[^0-9]/g, "");
  if (digits.length > 3) {
    expect(text, "amounts of 1000+ must use thousands separators").toContain(",");
  }
}

test("Discover card: top card shows photo, title, Needed and Raised naira amounts and a progress bar @affected", async ({
  page,
}) => {
  const card = await openTopCard(page);

  // Bill title
  const heading = card.getByRole("heading", { level: 2 });
  await expect(heading).toBeVisible();
  await expect(heading).not.toHaveText("");
  const title = (await heading.innerText()).trim();
  expect(title.length).toBeGreaterThan(0);

  // Bill photo (real image or the token-coloured photo slot)
  const photo = card.getByTestId("bill-photo");
  await expect(photo).toBeVisible();
  await expect(photo.getByRole("img")).toBeVisible();

  // Needed / Raised amounts, formatted in naira
  await expect(card.getByText("Needed", { exact: true })).toBeVisible();
  await expect(card.getByText("Raised", { exact: true })).toBeVisible();

  const needed = card.getByTestId("bill-needed-amount");
  const raised = card.getByTestId("bill-raised-amount");
  await expect(needed).toBeVisible();
  await expect(raised).toBeVisible();

  expectNairaAmount((await needed.innerText()).trim());
  expectNairaAmount((await raised.innerText()).trim());

  // Funding progress bar
  await expect(card.getByTestId("bill-progress")).toBeVisible();
});

test("Discover card: View details opens the bill page for the same bill @affected", async ({ page }) => {
  const card = await openTopCard(page);

  const heading = card.getByRole("heading", { level: 2 });
  await expect(heading).toBeVisible();
  const title = (await heading.innerText()).trim();

  await card.getByRole("link", { name: /view details/i }).click();

  await expect(page).toHaveURL(/\/bills\/[^/?#]+$/);

  // The detail page must show the same bill title that was on the card.
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();
});
