import { test, expect } from "@playwright/test";

/**
 * Header logo verification.
 *
 * Asserts that the ChiefCap brand mark renders *visibly* inside the site
 * header at phone and desktop widths, that it is exposed to assistive
 * technology under the exact accessible name "ChiefCap logo" (via
 * `aria-label` + `role="img"` + `<title>`), and that it carries the geometry
 * hooks the header CSS band relies on (`data-header-logo-slot`,
 * `data-header-logo`, `data-chief-cap-logo`).
 *
 * The mark may be an inline `<svg>` (the normal path via Header → HeaderLogo →
 * BrandMark → ChiefCapLogo) or an `<img>` fallback, so the selector accepts
 * either.
 */

const MARK_SELECTOR = 'svg[aria-label*="logo" i], img[alt*="logo" i]';

const HEADER_MARK_SELECTOR = `header[data-site-header] ${MARK_SELECTOR}`;

const ACCESSIBLE_NAME = "ChiefCap logo";

const VIEWPORTS = [
  { name: "phone-375", width: 375, height: 812, minSize: 17 },
  { name: "phone-390", width: 390, height: 844, minSize: 17 },
  { name: "desktop-1280", width: 1280, height: 800, minSize: 17 },
] as const;

/** Read the name the element actually exposes (aria-label, else alt, else <title>). */
async function readExposedName(
  mark: import("@playwright/test").Locator,
): Promise<string> {
  return mark.evaluate((el) => {
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim().length > 0) return ariaLabel.trim();
    const alt = el.getAttribute("alt");
    if (alt && alt.trim().length > 0) return alt.trim();
    const titleChild = el.querySelector("title");
    return (titleChild?.textContent ?? "").trim();
  });
}

/** True when the element paints with a non-zero box and is not hidden. */
async function isVisiblyRendered(
  mark: import("@playwright/test").Locator,
): Promise<boolean> {
  return mark.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    if (cs.display === "none") return false;
    if (cs.visibility === "hidden" || cs.visibility === "collapse")
      return false;
    const opacity = Number.parseFloat(cs.opacity || "1");
    if (!Number.isNaN(opacity) && opacity <= 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return false;
    return true;
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`header brand mark @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`renders a visible, labelled logo inside the header @affected`, async ({
      page,
    }) => {
      await page.goto("/");

      const header = page.locator("header[data-site-header]").first();
      await expect(header).toBeVisible();

      const mark = header.locator(MARK_SELECTOR).first();
      await expect(mark).toBeAttached();
      await expect(mark).toBeVisible();

      // --- accessible name -------------------------------------------------
      const exposedName = await readExposedName(mark);
      expect(exposedName).toBe(ACCESSIBLE_NAME);

      // --- role / hidden state ---------------------------------------------
      const isSvg = await mark.evaluate(
        (el) => el.tagName.toLowerCase() === "svg",
      );
      if (isSvg) {
        await expect(mark).toHaveAttribute("role", "img");
        const ariaHidden = await mark.getAttribute("aria-hidden");
        expect(ariaHidden).toBeNull();

        // The inline mark must also ship a matching <title> child.
        const titleText = await mark.locator("title").first().textContent();
        expect((titleText ?? "").trim()).toBe(exposedName);
      }

      // --- ancestry: header → logo slot ------------------------------
      const ancestry = await mark.evaluate((el) => ({
        inHeader: !!el.closest("header[data-site-header]"),
        inLogoSlot: !!el.closest("[data-header-logo-slot]"),
        hasHeaderLogoHook: el.hasAttribute("data-header-logo"),
        hasChiefCapHook: el.hasAttribute("data-chief-cap-logo"),
      }));

      expect(ancestry.inHeader).toBe(true);
      expect(ancestry.inLogoSlot).toBe(true);
      expect(ancestry.hasHeaderLogoHook).toBe(true);
      expect(ancestry.hasChiefCapHook).toBe(true);

      // --- computed visibility ---------------------------------------------
      const styles = await mark.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          display: cs.display,
          visibility: cs.visibility,
          opacity: Number.parseFloat(cs.opacity || "1"),
        };
      });

      expect(styles.display).not.toBe("none");
      expect(styles.visibility).not.toBe("hidden");
      expect(
        Number.isNaN(styles.opacity) ? 1 : styles.opacity,
      ).toBeGreaterThan(0);

      // --- real geometry ----------------------------------------------------
      const box = await mark.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return; // narrowing for TypeScript

      expect(box.width).toBeGreaterThan(vp.minSize);
      expect(box.height).toBeGreaterThan(vp.minSize);
      expect(box.x).toBeGreaterThanOrEqual(-0.5);
      expect(box.y).toBeGreaterThanOrEqual(-0.5);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 0.5);

      // The mark must sit inside the header band (not scrolled away).
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      if (headerBox) {
        expect(box.y).toBeGreaterThanOrEqual(headerBox.y - 0.5);
        expect(box.y + box.height).toBeLessThanOrEqual(
          headerBox.y + headerBox.height + 0.5,
        );
      }
    });

    test(`header exposes exactly one labelled, painted logo @affected`, async ({
      page,
    }) => {
      await page.goto("/");

      const header = page.locator("header[data-site-header]").first();
      await expect(header).toBeVisible();

      const marks = header.locator(MARK_SELECTOR);
      const count = await marks.count();
      expect(count).toBeGreaterThanOrEqual(1);

      let visibleNamed = 0;
      for (let i = 0; i < count; i += 1) {
        const candidate = marks.nth(i);
        // eslint-disable-next-line no-await-in-loop
        const named = (await readExposedName(candidate)) === ACCESSIBLE_NAME;
        // eslint-disable-next-line no-await-in-loop
        const painted = await isVisiblyRendered(candidate);
        if (named && painted) visibleNamed += 1;
      }

      expect(visibleNamed).toBe(1);
    });
  });
}

test.describe("header brand mark negative guard", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test(`header contains a visible labelled logo selector match @affected`, async ({
    page,
  }) => {
    await page.goto("/");

    const header = page.locator("header[data-site-header]").first();
    await expect(header).toBeVisible();

    // If the label is removed or the mark hidden, this resolves to 0 and
    // the assertions below flip the suite to failing.
    const headerMarks = page.locator(HEADER_MARK_SELECTOR);
    const matchCount = await headerMarks.count();
    expect(matchCount).toBeGreaterThanOrEqual(1);

    const first = headerMarks.first();
    await expect(first).toBeVisible();
    expect(await isVisiblyRendered(first)).toBe(true);
    expect(await readExposedName(first)).toBe(ACCESSIBLE_NAME);

    // Visible inside the header band, not scrolled out of the top bar.
    const headerBox = await header.boundingBox();
    const markBox = await first.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(markBox).not.toBeNull();
    if (headerBox && markBox) {
      expect(markBox.y).toBeGreaterThanOrEqual(headerBox.y - 0.5);
      expect(markBox.y + markBox.height).toBeLessThanOrEqual(
        headerBox.y + headerBox.height + 0.5,
      );
    }
  });
});

test.describe("header brand mark behavior", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test(`logo keeps both data hooks and sits before the wordmark @affected`, async ({
    page,
  }) => {
    await page.goto("/");

    const header = page.locator("header[data-site-header]").first();
    await expect(header).toBeVisible();

    const mark = header.locator(MARK_SELECTOR).first();
    await expect(mark).toBeAttached();
    await expect(mark).toBeVisible();

    await expect(mark).toHaveAttribute("data-header-logo", "");
    await expect(mark).toHaveAttribute("data-chief-cap-logo", "");

    const slot = header.locator("[data-header-logo-slot]").first();
    await expect(slot).toBeVisible();

    // The logo must render within the brand row, at the left of the header.
    const brandRow = header.locator("[data-header-brand-row]").first();
    await expect(brandRow).toBeVisible();

    const markBox = await mark.boundingBox();
    const brandRowBox = await brandRow.boundingBox();
    expect(markBox).not.toBeNull();
    expect(brandRowBox).not.toBeNull();
    if (markBox && brandRowBox) {
      expect(markBox.x).toBeLessThanOrEqual(brandRowBox.x + brandRowBox.width);
    }
  });

  test(`discover nav link still opens the discover page @affected`, async ({
    page,
  }) => {
    await page.goto("/");

    const header = page.locator("header[data-site-header]").first();
    await expect(header).toBeVisible();
    await expect(header.locator(MARK_SELECTOR).first()).toBeVisible();

    const discover = header.getByRole("link", { name: /discover/i }).first();
    await discover.click();

    await expect(page).toHaveURL(/\/discover/);
    await expect(
      page.getByRole("heading", { name: /verified requests/i }).first(),
    ).toBeVisible();
  });
});
