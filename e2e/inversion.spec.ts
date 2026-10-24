import { expect, test, type Locator, type Page } from "@playwright/test";

import { inversion } from "@content/sections/inversion";

import { openAt, openDesktop } from "./viewport";
import { statementHeightInLines } from "./helpers";

test("up to 1023px each statement of INVERSION is centered from left to right", async ({
  page,
}) => {
  for (const width of [1023, 768, 375, 320]) {
    await openAt(page, width, 900);
    const offsets = await page
      .locator("#inversion p.font-bold")
      .evaluateAll((paragraphs) =>
        paragraphs.map((paragraph) => {
          const range = document.createRange();
          range.selectNodeContents(paragraph);
          const text = range.getBoundingClientRect();
          const area = (
            paragraph.parentElement as HTMLElement
          ).getBoundingClientRect();
          return text.left + text.width / 2 - (area.left + area.width / 2);
        }),
      );
    expect(offsets).toHaveLength(2);
    for (const offset of offsets)
      expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  }
});

const statementBoxes = (page: Page) => {
  const section = page.locator("#inversion");
  return {
    lead: section.getByText(inversion.body[0].lead ?? "", { exact: true }),
    main: section.getByText(/常に.*発想/).first(),
    tail: section.getByText(inversion.body[1].tail ?? "", { exact: true }),
  };
};

test("the big copy: the key half is drawn larger than the lead, and there is no rule above the statements", async ({
  page,
}) => {
  await openDesktop(page);
  const { lead, main, tail } = statementBoxes(page);
  const sizes = await Promise.all(
    [lead, main, tail].map((locator) =>
      locator.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      ),
    ),
  );
  expect(sizes[0]).toBeGreaterThanOrEqual(24);
  expect(sizes[0]).toBeLessThanOrEqual(25.5);
  expect(sizes[1]).toBeGreaterThanOrEqual(30.5);
  expect(sizes[1]).toBeLessThanOrEqual(32);
  expect(sizes[1] / sizes[0]).toBeGreaterThanOrEqual(1.2);
  expect(sizes[2]).toBe(sizes[0]);

  const rules = await page.locator("#inversion p").evaluateAll((items) =>
    items.map((item) => {
      let element: Element | null = item;
      let widest = 0;
      while (element && element.tagName !== "SECTION") {
        widest = Math.max(
          widest,
          parseFloat(getComputedStyle(element).borderTopWidth),
        );
        element = element.parentElement;
      }
      return widest;
    }),
  );
  expect(rules.every((width) => width === 0)).toBe(true);
});

test("the tail of the second statement follows its closing quote without a gap at every screen size", async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 375, 320]) {
    await openAt(page, width, 900);
    const { tail } = statementBoxes(page);
    const gap = await tail.evaluate((element) => {
      const main = element.previousElementSibling as HTMLElement;
      return (
        element.getBoundingClientRect().left -
        main.getBoundingClientRect().right
      );
    });
    expect(gap).toBeGreaterThanOrEqual(-1);
    expect(gap).toBeLessThanOrEqual(2);
  }
});

for (const theme of ["light", "dark"] as const) {
  test(`the highlighted phrases are inverted blocks of the text color in the ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((value) => {
      localStorage.setItem("theme", value);
    }, theme);
    await page.goto("/");
    const chips = page.locator("#inversion p span.bg-ink");
    await expect(chips).toHaveCount(2);
    const colors = await chips.first().evaluate((chip) => {
      const paragraph = chip.closest("p");
      return {
        chipBackground: getComputedStyle(chip).backgroundColor,
        chipText: getComputedStyle(chip).color,
        paragraphText: paragraph ? getComputedStyle(paragraph).color : "",
        pageBackground: getComputedStyle(document.body).backgroundColor,
      };
    });
    expect(colors.chipBackground).toBe(colors.paragraphText);
    expect(colors.chipText).toBe(colors.pageBackground);
  });
}

const startOf = (locator: Locator) =>
  locator.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (!first) return null;
    const range = document.createRange();
    range.selectNodeContents(first);
    return range.getBoundingClientRect().left;
  });

test("both statements are one line each at every screen size, starting at the left edge of the area from 1024px", async ({
  page,
}) => {
  for (const width of [
    2560, 1920, 1440, 1280, 1024, 1023, 768, 600, 375, 320,
  ]) {
    await openAt(page, width, 900);
    expect(await statementHeightInLines(page, 0)).toBe(1);
    expect(await statementHeightInLines(page, 1)).toBe(1);

    const section = page.locator("#inversion");
    await expect(section.getByText(/^0\d$/)).toHaveCount(0);
    if (width >= 1024) {
      const [firstX, secondX] = await Promise.all([
        startOf(section.locator("p.font-bold").nth(0)),
        startOf(section.locator("p.font-bold").nth(1)),
      ]);
      expect(Math.abs(secondX! - firstX!)).toBeLessThanOrEqual(1);
    }

    const sideways = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(sideways).toBe(false);
  }
});

const textSizes = (page: Page) => {
  const { lead, main, tail } = statementBoxes(page);
  return Promise.all(
    [lead, main, tail].map((locator) =>
      locator.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      ),
    ),
  );
};

const LEAD_CQW = 0.036;

const MAIN_CQW = 0.046;

test("the text follows the width of its own area by one ratio at every screen size, with no cap and no breakpoint", async ({
  page,
}) => {
  for (const width of [
    2560, 1920, 1440, 1280, 1100, 1024, 1023, 900, 768, 600, 375, 320,
  ]) {
    await openAt(page, width, 900);
    const areaWidth = await page
      .locator("#inversion p.font-bold")
      .first()
      .evaluate(
        (paragraph) => (paragraph.parentElement as HTMLElement).clientWidth,
      );
    const [lead, main, tail] = await textSizes(page);
    expect(lead).toBeCloseTo(areaWidth * LEAD_CQW, 1);
    expect(main).toBeCloseTo(areaWidth * MAIN_CQW, 1);
    expect(tail).toBe(lead);
  }
});

test("the first statement fills about three quarters of its area at every screen size", async ({
  page,
}) => {
  const fills: number[] = [];
  for (const width of [2560, 1440, 1100, 1024, 1023, 768, 375, 320]) {
    await openAt(page, width, 900);
    fills.push(
      await page
        .locator("#inversion p.font-bold")
        .first()
        .evaluate((paragraph) => {
          const range = document.createRange();
          range.selectNodeContents(paragraph);
          return (
            range.getBoundingClientRect().width /
            (paragraph.parentElement as HTMLElement).clientWidth
          );
        }),
    );
  }
  for (const fill of fills) {
    expect(fill).toBeGreaterThan(0.68);
    expect(fill).toBeLessThan(0.8);
  }
  expect(Math.max(...fills) - Math.min(...fills)).toBeLessThan(0.05);
});

test("from 1024px the lead and the key phrase of the second statement stay at the left edge", async ({
  page,
}) => {
  for (const width of [1440, 1024]) {
    await openAt(page, width, 900);
    const section = page.locator("#inversion");
    const xs = await Promise.all([
      startOf(section.locator("p.font-bold").nth(0)),
      startOf(section.locator("p.font-bold").nth(1)),
    ]);
    expect(Math.abs(xs[0]! - xs[1]!)).toBeLessThanOrEqual(1);
  }
});

test("each statement trims the blank of an opening bracket at the start of its line", async ({
  page,
}) => {
  await page.goto("/");
  const values = await page
    .locator("#inversion p.font-bold")
    .evaluateAll((items) =>
      items.map((item) =>
        getComputedStyle(item).getPropertyValue("text-spacing-trim"),
      ),
    );
  expect(values).toHaveLength(2);
  for (const value of values) expect(value).toBe("trim-start");
});
