import fs from "node:fs";
import path from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { hero } from "@content/sections/hero";
import { news } from "@content/sections/news";
import { pipeline } from "@content/sections/pipeline";
import { tools } from "@content/sections/tools";
import { site } from "@content/site";

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element is not visible");
  return box;
}

test("the home page shows one top-level heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("the header, the sections and the footer share the same edges on a wide screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const logo = await boxOf(
    page.getByRole("banner").getByRole("link", { name: site.name }),
  );
  const heading = await boxOf(page.getByRole("heading", { level: 2 }).first());
  const footerText = await boxOf(page.locator("footer p").first());
  expect(Math.abs(logo.x - heading.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(footerText.x - heading.x)).toBeLessThanOrEqual(1);

  const toggle = await boxOf(
    page.getByRole("banner").getByRole("button", { name: site.themeLabel }),
  );
  const list = await boxOf(page.locator("#news ol"));
  expect(
    Math.abs(toggle.x + toggle.width - (list.x + list.width)),
  ).toBeLessThanOrEqual(1);
});

test("the replay box keeps one height while playing and across stages", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#pipeline");
  const log = section.getByRole("log");
  await log.scrollIntoViewIfNeeded();
  const heights = new Set<number>();

  for (const stage of pipeline.stages) {
    await section
      .getByRole("button", { name: new RegExp(stage.stage) })
      .click();
    heights.add((await boxOf(log)).height);
    const last = stage.terminal[stage.terminal.length - 1];
    await expect(log).toContainText(last.trim());
    heights.add((await boxOf(log)).height);
  }

  expect([...heights]).toHaveLength(1);
});

test("the stage buttons share the full width of their container equally", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const section = page.locator("#pipeline");
  const container = await boxOf(section.locator("ol").locator("xpath=.."));
  const buttons = section.locator("ol button");
  const count = await buttons.count();
  expect(count).toBe(pipeline.stages.length);

  const boxes: Box[] = [];
  for (let index = 0; index < count; index += 1) {
    boxes.push(await boxOf(buttons.nth(index)));
  }
  for (const box of boxes) {
    expect(Math.abs(box.width - boxes[0].width)).toBeLessThanOrEqual(1);
  }
  const last = boxes[count - 1];
  expect(Math.abs(boxes[0].x - container.x)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(last.x + last.width - (container.x + container.width)),
  ).toBeLessThanOrEqual(1);
});

for (const width of [1440, 375]) {
  test(`the PIPELINE section keeps one height for every stage at ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const section = page.locator("#pipeline");
    const heights = new Set<number>();

    for (const stage of pipeline.stages) {
      await section
        .getByRole("button", { name: new RegExp(stage.stage) })
        .click();
      const last = stage.terminal[stage.terminal.length - 1];
      await expect(section.getByRole("log")).toContainText(last.trim());
      heights.add(Math.round((await boxOf(section)).height));
      for (const other of pipeline.stages) {
        if (other.id === stage.id) continue;
        await expect(section.getByText(other.detail)).toBeHidden();
      }
      await expect(section.getByText(stage.detail)).toBeVisible();
    }

    expect([...heights]).toHaveLength(1);

    const blocks = section
      .getByRole("heading", { level: 3, includeHidden: true })
      .locator("xpath=..");
    const blockHeights: number[] = [];
    for (let index = 0; index < pipeline.stages.length; index += 1) {
      blockHeights.push((await boxOf(blocks.nth(index))).height);
    }
    const cell = await boxOf(blocks.first().locator("xpath=.."));
    expect(
      Math.abs(cell.height - Math.max(...blockHeights)),
    ).toBeLessThanOrEqual(1);
  });
}

for (const width of [1440, 375]) {
  test(`the TOOLS rows keep one height on every page at ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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

const themeToggle = (page: Page) =>
  page
    .getByRole("banner")
    .first()
    .getByRole("button", { name: site.themeLabel });

test.describe("the theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
  });

  test("a chosen theme survives a reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await themeToggle(page).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await themeToggle(page).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("a saved dark theme is in place before the page is first drawn", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          const body = getComputedStyle(document.body).backgroundColor;
          Object.assign(window, {
            firstState: {
              isDark: document.documentElement.classList.contains("dark"),
              body,
            },
          });
        },
        { once: true },
      );
    });
    await page.goto("/");
    const first = await page.evaluate(
      () =>
        (window as unknown as { firstState: { isDark: boolean; body: string } })
          .firstState,
    );
    expect(first.isDark).toBe(true);
    const [red, green, blue] = (first.body.match(/\d+/g) ?? []).map(Number);
    expect(Math.max(red, green, blue)).toBeLessThan(80);
  });
});

test("nothing makes the page scroll sideways on a 320px screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the page still works when WebGL is unavailable", async ({ page }) => {
  const uncaught: string[] = [];
  page.on("pageerror", (error) => uncaught.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (original as (...args: unknown[]) => unknown).call(
        this,
        type,
        ...rest,
      );
    } as typeof original;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByText(hero.sceneFallback)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("banner")
    .first()
    .getByRole("link", { name: site.nav[site.nav.length - 1].label })
    .click();
  await expect(page.locator("#contact")).toBeInViewport();
  expect(uncaught).toEqual([]);
});

test.describe("the reduced-motion setting", () => {
  test("is reported on the hero, shows the whole log at once and turns smooth scrolling off", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("#hero")).toHaveAttribute(
      "data-motion",
      "reduced",
    );
    const first = pipeline.stages[0].terminal;
    await expect(page.locator("#pipeline pre")).toHaveText(first.join("\n"));
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    ).toBe("auto");
  });

  test("is not assumed when the visitor did not ask for it", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("#hero")).toHaveAttribute("data-motion", "full");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    ).toBe("smooth");
  });
});

test("a pipeline stage can be chosen with the keyboard", async ({ page }) => {
  await page.goto("/#pipeline");
  const buttons = page.locator("#pipeline ol button");
  await buttons.nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "false");
});

async function settledTop(section: Locator) {
  let last = Number.NaN;
  let stableReads = 0;
  for (let read = 0; read < 80 && stableReads < 4; read += 1) {
    const current = Math.round((await boxOf(section)).y);
    stableReads = current === last ? stableReads + 1 : 0;
    last = current;
    await section.page().waitForTimeout(60);
  }
  return last;
}

test("every item of the header nav leads to its section, below the header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const item of site.nav) {
    await page
      .getByRole("banner")
      .first()
      .getByRole("link", { name: item.label })
      .click();
    const section = page.locator(item.href);
    await expect(section).toBeInViewport();
    const top = await settledTop(section);
    expect(top).toBeGreaterThanOrEqual(55);
    expect(top).toBeLessThanOrEqual(60);
  }
});

test("the menu on a phone opens, leads to a section and closes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: site.menuLabel });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const toolsItem = site.nav.find((item) => item.href === "#tools");
  if (!toolsItem) throw new Error("the nav has no tools item");
  await page
    .getByRole("navigation", { name: site.menuLabel })
    .last()
    .getByRole("link", { name: toolsItem.label })
    .click();
  await expect(page.locator("#tools")).toBeInViewport();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("the menu on a phone closes with Escape and gives the focus back", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: site.menuLabel });
  await menu.click();
  await page
    .getByRole("navigation", { name: site.menuLabel })
    .last()
    .getByRole("link")
    .first()
    .focus();
  await expect(menu).not.toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
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
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

test("the news list pages through every entry with the keyboard", async ({
  page,
}) => {
  const total = fs
    .readdirSync(NEWS_FOLDER)
    .filter((file) => file.endsWith(".md")).length;
  const pageCount = Math.ceil(total / news.perPage);

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/");
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
