import { expect, test, type Page } from "@playwright/test";

import { inversion } from "@content/sections/inversion";

import { openAt, openDesktop } from "./viewport";

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
