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

test("the GitHub icon in front of a tool opens its repository in a new tab", async ({
  page,
  context,
}) => {
  await context.route("https://github.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<title>stub</title>",
    }),
  );
  await page.goto("/");
  const section = page.locator("#tools");
  const entry = tools.entries[0];
  if (!entry.repoUrl) throw new Error("the first tool needs a repository url");
  const link = section.getByRole("link", {
    name: tools.repoLinkLabel.replace("{name}", entry.name),
  });
  await link.scrollIntoViewIfNeeded();

  const icon = await boxOf(link);
  const name = await boxOf(section.getByRole("button", { name: entry.name }));
  expect(icon.x + icon.width).toBeLessThanOrEqual(name.x);
  expect(icon.width).toBeGreaterThanOrEqual(32);
  expect(icon.height).toBeGreaterThanOrEqual(32);

  const addressBefore = page.url();
  const newTab = context.waitForEvent("page");
  await link.click();
  const opened = await newTab;
  await opened.waitForLoadState();
  expect(opened.url()).toBe(entry.repoUrl);
  expect(page.url()).toBe(addressBefore);
});

test("the news are listed newest first", async ({ page }) => {
  await page.goto("/");
  const dates = await page
    .locator("#news time")
    .evaluateAll((times) => times.map((time) => time.getAttribute("datetime")));
  expect(dates.length).toBeGreaterThan(1);
  expect(dates).toEqual([...dates].sort().reverse());
});

test("a tool's detail opens and closes with the keyboard, and the pager moves on", async ({
  page,
}) => {
  await page.goto("/#tools");
  const toggle = page.locator("#tools tbody tr button").first();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  const next = page
    .locator("#tools")
    .getByRole("button", { name: tools.pager.next });
  const previous = page
    .locator("#tools")
    .getByRole("button", { name: tools.pager.prev });
  await expect(previous).toBeDisabled();
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
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

test("the pagers of the news list and the tools table sit at the left edge of their list", async ({
  page,
}) => {
  await openDesktop(page);

  const pagers = [
    { id: "news", list: "ol", labels: news.pager },
    { id: "tools", list: "table", labels: tools.pager },
  ];
  for (const { id, list, labels } of pagers) {
    const section = page.locator(`#${id}`);
    const listBox = await boxOf(section.locator(list));
    const previous = await boxOf(
      section.getByRole("button", { name: labels.prev }),
    );
    const next = await boxOf(
      section.getByRole("button", { name: labels.next }),
    );
    expect(previous.x - listBox.x).toBeGreaterThanOrEqual(0);
    expect(previous.x - listBox.x).toBeLessThanOrEqual(16);
    expect(next.x + next.width - listBox.x).toBeLessThan(200);
  }
});
