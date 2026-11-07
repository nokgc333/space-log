import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { news } from "@content/sections/news";
import { tools } from "@content/sections/tools";

import { openAt, openDesktop } from "./viewport";
import { boxOf } from "./helpers";

for (const width of [1440, 375]) {
  test(`the TOOLS rows keep one height on every page at ${width} px`, async ({
    page,
  }) => {
    await openAt(page, width, 900);
    const section = page.locator("#tools");
    const rows = section.locator("tbody tr");
    const next = section.getByRole("button", { name: tools.pager.next });
    const previous = section.getByRole("button", { name: tools.pager.prev });
    await rows.first().scrollIntoViewIfNeeded();

    const heightsOnThisPage = async () => {
      const heights: number[] = [];
      for (let index = 0; index < (await rows.count()); index += 1) {
        heights.push(Math.round((await boxOf(rows.nth(index))).height));
      }
      return heights;
    };
    const looseCells = () =>
      section.locator("tbody tr:not([aria-hidden]) td > div").evaluateAll(
        (cells) =>
          cells.filter((cell) => {
            const style = getComputedStyle(cell);
            const lineHeight = parseFloat(style.lineHeight);
            return (
              style.webkitLineClamp !== "2" ||
              Math.abs(cell.clientHeight - 2 * lineHeight) > 1
            );
          }).length,
      );
    const fillerLines = () =>
      section
        .locator("tbody tr[aria-hidden]")
        .evaluateAll(
          (rows) =>
            rows.filter(
              (row) =>
                getComputedStyle(row).borderBottomColor !== "rgba(0, 0, 0, 0)",
            ).length,
        );

    const firstRow = await boxOf(rows.first());
    const firstName = await boxOf(rows.first().getByRole("button"));
    expect(
      Math.abs(
        firstName.y + firstName.height / 2 - (firstRow.y + firstRow.height / 2),
      ),
    ).toBeLessThanOrEqual(2);

    const firstPage = await heightsOnThisPage();
    expect(new Set(firstPage).size).toBe(1);
    expect(await looseCells()).toBe(0);
    const firstTableHeight = (await boxOf(section.locator("table"))).height;
    const addressBefore = page.url();

    await next.click();
    const secondPage = await heightsOnThisPage();
    expect(secondPage).toEqual(firstPage);
    expect(await looseCells()).toBe(0);
    expect(await fillerLines()).toBe(0);
    expect((await boxOf(section.locator("table"))).height).toBe(
      firstTableHeight,
    );
    expect(page.url()).toBe(addressBefore);

    await previous.click();
    expect(await heightsOnThisPage()).toEqual(firstPage);
  });
}

test("the news are listed newest first", async ({ page }) => {
  await page.goto("/");
  const dates = await page
    .locator("#news time")
    .evaluateAll((times) => times.map((time) => time.getAttribute("datetime")));
  expect(dates.length).toBeGreaterThan(1);
  expect(dates).toEqual([...dates].sort().reverse());
});

const NEWS_FOLDER = path.join(process.cwd(), "content", "news");

test("the news list pages through every entry with the keyboard", async ({
  page,
}) => {
  const total = fs
    .readdirSync(NEWS_FOLDER)
    .filter((file) => file.endsWith(".md")).length;
  const pageCount = Math.ceil(total / news.perPage);

  await openDesktop(page);
  const section = page.locator("#news");
  const items = section.getByRole("listitem");
  const next = section.getByRole("button", { name: news.pager.next });
  const previous = section.getByRole("button", { name: news.pager.prev });

  if (pageCount === 1) {
    await expect(items).toHaveCount(total);
    await expect(next).toHaveCount(0);
    await expect(previous).toHaveCount(0);
    return;
  }

  const listHeight = () =>
    section
      .locator("ol")
      .evaluate((list) => list.getBoundingClientRect().height);

  await expect(items).toHaveCount(news.perPage);
  await expect(section.getByText(`1 / ${pageCount}`)).toBeVisible();
  await expect(previous).toBeDisabled();
  const firstPageTexts = await items.allTextContents();
  const firstPageHeight = await listHeight();

  await next.focus();
  await page.keyboard.press("Enter");
  await expect(section.getByText(`2 / ${pageCount}`)).toBeVisible();
  await expect(items).toHaveCount(Math.min(news.perPage, total - news.perPage));
  const secondPageTexts = await items.allTextContents();
  for (const text of secondPageTexts)
    expect(firstPageTexts).not.toContain(text);
  expect(await listHeight()).toBeCloseTo(firstPageHeight, 0);

  await previous.focus();
  await page.keyboard.press("Enter");
  await expect(section.getByText(`1 / ${pageCount}`)).toBeVisible();
  expect(await items.allTextContents()).toEqual(firstPageTexts);
});
