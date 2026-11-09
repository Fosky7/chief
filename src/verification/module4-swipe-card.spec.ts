import { test, expect } from "@playwright/test";

test.describe("Module 4 — swipe card & progress bar @affected", () => {
  test("top card shows a photo, title, Needed and Raised amounts and a progress bar @affected", async ({
    page,
  }) => {
    await page.goto("/discover");

    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible();

    // Bill photo
    const photo = card.getByTestId("swipe-card-photo").first();
    await expect(photo).toBeVisible();
    const tagName = await photo.evaluate((element) => element.tagName);
    if (tagName === "IMG") {
      const src = await photo.getAttribute("src");
      expect(src, "the bill photo should have a real source").toBeTruthy();
      expect(src as string).not.toHaveLength(0);
    }

    // Bill title
    const title = card.getByTestId("swipe-card-title").first();
    await expect(title).toBeVisible();
    expect((await title.innerText()).trim().length).toBeGreaterThan(0);

    // Needed amount uses ₦ with thousands separators
    const needed = card.getByTestId("swipe-card-needed").first();
    await expect(needed).toBeVisible();
    await expect(needed).toHaveText(/₦\s?\d{1,3}(,\d{3})+/);

    // Raised amount uses ₦ with thousands separators
    const raised = card.getByTestId("swipe-card-raised").first();
    await expect(raised).toBeVisible();
    await expect(raised).toHaveText(/₦\s?\d{1,3}(,\d{3})+/);

    // Progress bar is rendered inside the card
    const progressGroup = card.getByTestId("swipe-card-progress").first();
    await expect(progressGroup).toBeVisible();
    await expect(progressGroup.getByRole("progressbar")).toBeVisible();
  });

  test("progress bar shows a filled portion for a bill that already has donations @affected", async ({
    page,
  }) => {
    await page.goto("/discover");

    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible();

    const bar = card.getByTestId("swipe-card-progress").getByRole("progressbar").first();
    await expect(bar).toBeVisible();

    const valueNow = Number(await bar.getAttribute("aria-valuenow"));
    expect(Number.isFinite(valueNow)).toBeTruthy();
    expect(valueNow).toBeGreaterThan(0);
    expect(valueNow).toBeLessThan(100);

    const fill = card.getByTestId("progress-bar-fill").first();
    await expect(fill).toBeVisible();

    const fillBox = await fill.boundingBox();
    const trackBox = await bar.boundingBox();
    expect(fillBox, "the progress fill should have a measurable box").not.toBeNull();
    expect(trackBox, "the progress track should have a measurable box").not.toBeNull();

    const fillWidth = fillBox?.width ?? 0;
    const trackWidth = trackBox?.width ?? 0;

    expect(fillWidth).toBeGreaterThan(0);
    // A partially funded bill must not appear completely full.
    expect(fillWidth).toBeLessThan(trackWidth);
  });
});
