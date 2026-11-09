import { test, expect, type Page } from "@playwright/test";

const DISCOVER_PATH = "/discover";

async function readTopCardTitle(page: Page): Promise<string> {
  const heading = page.getByTestId("swipe-card-top").getByRole("heading", { level: 2 });
  await expect(heading).toBeVisible();
  return (await heading.innerText()).trim();
}

async function expectDeckAdvanced(page: Page, beforePosition: string, beforeTitle: string) {
  await expect(page.getByTestId("deck-position")).not.toHaveText(beforePosition);

  const nextTop = page.getByTestId("swipe-card-top");
  if ((await nextTop.count()) > 0) {
    await expect(nextTop.getByRole("heading", { level: 2 })).not.toHaveText(beforeTitle);
  } else {
    // Reaching the end of the deck is a valid advance too.
    await expect(page.getByTestId("deck-empty")).toBeVisible();
  }
}

test("Discover deck: Skip button advances to the next bill card @affected", async ({ page }) => {
  await page.goto(DISCOVER_PATH);

  const position = page.getByTestId("deck-position");
  await expect(position).toBeVisible();
  const beforePosition = (await position.innerText()).trim();
  const beforeTitle = await readTopCardTitle(page);

  await page.getByRole("button", { name: "Skip" }).click();

  await expectDeckAdvanced(page, beforePosition, beforeTitle);
});

test("Discover deck: Give button opens the amount chooser @affected", async ({ page }) => {
  await page.goto(DISCOVER_PATH);
  await expect(page.getByTestId("swipe-card-top")).toBeVisible();

  await page.getByRole("button", { name: "Give" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Choose an amount" })).toBeVisible();

  // Close round-trip keeps the deck usable afterwards.
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("swipe-card-top")).toBeVisible();
});

test("Discover deck: dragging the top card left advances to the next bill card @affected", async ({
  page,
}) => {
  await page.goto(DISCOVER_PATH);

  const position = page.getByTestId("deck-position");
  await expect(position).toBeVisible();
  const beforePosition = (await position.innerText()).trim();
  const beforeTitle = await readTopCardTitle(page);

  const card = page.getByTestId("swipe-card-top");
  const box = await card.boundingBox();
  expect(box, "the top swipe card must be laid out before dragging").not.toBeNull();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + Math.min(48, box!.height / 2);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 40, startY, { steps: 4 });
  await page.mouse.move(startX - 220, startY, { steps: 12 });
  await page.mouse.up();

  await expectDeckAdvanced(page, beforePosition, beforeTitle);
});
