import fs from "node:fs";
import path from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { hero } from "@content/sections/hero";
import { inversion } from "@content/sections/inversion";
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

test("the header and the sections share the same edges from the md breakpoint, and the footer from 1024px", async ({
  page,
}) => {
  for (const width of [1920, 1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const logo = await boxOf(
      page.getByRole("banner").getByRole("link", { name: site.name }),
    );
    const heading = await boxOf(
      page.getByRole("heading", { level: 2 }).first(),
    );
    const footerText = await boxOf(page.locator("footer p").first());
    const contentLeft = await page.evaluate(() => {
      const frame = document.querySelector("#news > div") as HTMLElement;
      return (
        frame.getBoundingClientRect().left +
        parseFloat(getComputedStyle(frame).paddingLeft)
      );
    });
    expect(Math.abs(logo.x - contentLeft)).toBeLessThanOrEqual(1);
    if (width >= 1024) {
      expect(Math.abs(logo.x - heading.x)).toBeLessThanOrEqual(1);
    }
    if (width >= 1024)
      expect(Math.abs(footerText.x - heading.x)).toBeLessThanOrEqual(1);

    const rightmost = await boxOf(
      page.getByRole("banner").getByRole("button", {
        name: width < 1024 ? site.menuLabel : site.themeLabel,
      }),
    );
    const list = await boxOf(page.locator("#news ol"));
    expect(
      Math.abs(rightmost.x + rightmost.width - (list.x + list.width)),
    ).toBeLessThanOrEqual(1);
  }
});

test("from 1024px the heading column sits beside the content, and up to 1023px they are stacked", async ({
  page,
}) => {
  for (const width of [768, 900, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const heading = await boxOf(page.locator("#news h2"));
    const list = await boxOf(page.locator("#news ol"));
    const contentLeft = await page.evaluate(() => {
      const frame = document.querySelector("#news > div") as HTMLElement;
      return (
        frame.getBoundingClientRect().left +
        parseFloat(getComputedStyle(frame).paddingLeft)
      );
    });
    expect(Math.abs(list.x - contentLeft)).toBeLessThanOrEqual(1);
    expect(list.y).toBeGreaterThan(heading.y + heading.height);
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const heading = await boxOf(page.locator("#news h2"));
    const list = await boxOf(page.locator("#news ol"));
    expect(list.x).toBeGreaterThan(heading.x + 200);
  }
});

test("the header shows the full nav from 1024px and the menu button below it", async ({
  page,
}) => {
  for (const width of [768, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: site.menuLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: site.nav[0].label }),
    ).toBeHidden();
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: site.menuLabel }),
    ).toBeHidden();
    await expect(
      page.getByRole("banner").getByRole("link", { name: site.nav[0].label }),
    ).toBeVisible();
  }
});

test("the footer lines its parts up in a row from 1024px and stacks them below it", async ({
  page,
}) => {
  for (const width of [768, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const parts = page.locator("footer p");
    const [first, second] = [
      await boxOf(parts.nth(0)),
      await boxOf(parts.nth(1)),
    ];
    expect(second.y).toBeGreaterThan(first.y + first.height - 1);
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const parts = page.locator("footer p");
    const [first, second] = [
      await boxOf(parts.nth(0)),
      await boxOf(parts.nth(1)),
    ];
    expect(second.x).toBeGreaterThan(first.x + first.width - 1);
  }
});

const stageFit = async (page: Page) => {
  const container = page.locator("#pipeline ol").locator("xpath=..");
  return container.evaluate((element) => {
    const row = element.querySelector("ol") as HTMLElement;
    const box = element.getBoundingClientRect();
    const buttons = [...row.querySelectorAll("button")] as HTMLElement[];
    const first = buttons[0];
    const [stage, tool] = [...first.children].map((child) =>
      child.getBoundingClientRect(),
    );
    return {
      scrolls: element.scrollWidth > element.clientWidth,
      rowWidth: row.getBoundingClientRect().width,
      containerWidth: box.width,
      outside: buttons.filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.left < box.left - 1 || rect.right > box.right + 1;
      }).length,
      clipped: buttons.filter(
        (button) => button.scrollWidth > button.clientWidth + 1,
      ).length,
      widths: buttons.map((button) => button.getBoundingClientRect().width),
      stageSize: parseFloat(getComputedStyle(first.children[0]).fontSize),
      toolSize: parseFloat(getComputedStyle(first.children[1]).fontSize),
      sameLine: tool.left >= stage.right - 1 && tool.top < stage.bottom - 1,
      stacked: tool.top >= stage.bottom - 1,
      wrapped: buttons.filter((button) =>
        [...button.children].some(
          (child) =>
            child.getBoundingClientRect().height >
            parseFloat(getComputedStyle(child).lineHeight) * 1.5,
        ),
      ).length,
      fill: Math.max(
        ...buttons.map((button) => {
          const style = getComputedStyle(button);
          const inner =
            button.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight);
          const rects = [...button.children].map((child) =>
            child.getBoundingClientRect(),
          );
          const content =
            Math.max(...rects.map((rect) => rect.right)) -
            Math.min(...rects.map((rect) => rect.left));
          return content / inner;
        }),
      ),
    };
  });
};

test("the stage buttons shrink with the row to show every stage without scrolling sideways", async ({
  page,
}) => {
  for (const width of [1440, 1280, 1100, 1024, 1023, 900, 767, 520, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const fit = await stageFit(page);
    expect(fit.scrolls).toBe(false);
    expect(Math.abs(fit.rowWidth - fit.containerWidth)).toBeLessThanOrEqual(1);
    expect(fit.outside).toBe(0);
    expect(fit.clipped).toBe(0);
    for (const buttonWidth of fit.widths)
      expect(Math.abs(buttonWidth - fit.widths[0])).toBeLessThanOrEqual(1);
    expect(fit.stageSize).toBeLessThanOrEqual(16);
    expect(fit.toolSize / fit.stageSize).toBeCloseTo(0.75, 2);
    if (width >= 1280 || (width >= 768 && width < 1024))
      expect(fit.stageSize).toBe(16);
    expect(fit.wrapped).toBe(0);
    expect(fit.fill).toBeLessThanOrEqual(1.1);
    if (fit.stageSize < 16) expect(fit.fill).toBeGreaterThanOrEqual(0.8);
  }
});

test("the stage buttons and the INVERSION statements stay in place when every letter is about 10% wider, as when a platform rounds the width of each letter up", async ({
  page,
}) => {
  for (const width of [1440, 1100, 1024, 1023, 900, 767, 520, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.addStyleTag({
      content:
        "#pipeline ol button span, #inversion p { letter-spacing: 0.055em !important; }",
    });
    const fit = await stageFit(page);
    expect(fit.scrolls).toBe(false);
    expect(fit.outside).toBe(0);
    expect(fit.clipped).toBe(0);
    expect(fit.wrapped).toBe(0);
    expect(await statementHeightInLines(page, 0)).toBe(1);
    expect(await statementHeightInLines(page, 1)).toBe(1);
    const sideways = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(sideways).toBe(false);
  }
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

test("up to 1023px the hero content is centered both ways and its text is centered", async ({
  page,
}) => {
  for (const width of [1023, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const centers = await page.evaluate(() => {
      const section = document.querySelector("#hero") as HTMLElement;
      const header = document.querySelector("#hero header") as HTMLElement;
      const box = section.getBoundingClientRect();
      const head = header.getBoundingClientRect();
      return {
        dx: head.left + head.width / 2 - (box.left + box.width / 2),
        dy: head.top + head.height / 2 - (box.top + box.height / 2),
        align: getComputedStyle(header).textAlign,
      };
    });
    expect(Math.abs(centers.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(centers.dy)).toBeLessThanOrEqual(8);
    expect(centers.align).toBe("center");
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const wide = await page.evaluate(() => {
      const section = document.querySelector("#hero") as HTMLElement;
      const header = document.querySelector("#hero header") as HTMLElement;
      const box = section.getBoundingClientRect();
      const head = header.getBoundingClientRect();
      return {
        align: getComputedStyle(header).textAlign,
        dy: head.top + head.height / 2 - (box.top + box.height / 2),
      };
    });
    expect(["start", "left"]).toContain(wide.align);
    expect(wide.dy).toBeGreaterThan(100);
  }
});

test("up to 1023px every section header and its text are centered from left to right, and start at the left edge from 1024px", async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() =>
      ["inversion", "news", "pipeline", "tools", "contact"].map((id) => {
        const frame = document.querySelector(`#${id} > div`) as HTMLElement;
        const header = frame.querySelector("header") as HTMLElement;
        const style = getComputedStyle(frame);
        const left =
          frame.getBoundingClientRect().left + parseFloat(style.paddingLeft);
        const width =
          frame.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        const box = header.getBoundingClientRect();
        return {
          dx: box.left + box.width / 2 - (left + width / 2),
          startGap: box.left - left,
          align: getComputedStyle(header).textAlign,
        };
      }),
    );
  for (const width of [1023, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const header of await read()) {
      expect(Math.abs(header.dx)).toBeLessThanOrEqual(1);
      expect(header.align).toBe("center");
    }
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const header of await read()) {
      expect(Math.abs(header.startGap)).toBeLessThanOrEqual(1);
      expect(["start", "left"]).toContain(header.align);
    }
  }
});

test("up to 1023px each statement of INVERSION is centered from left to right", async ({
  page,
}) => {
  for (const width of [1023, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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

test("up to 1023px the consent line and the send button of CONTACT are centered from left to right", async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() => {
      const form = document.querySelector("#contact form") as HTMLElement;
      const label = form.querySelector("label.flex") as HTMLElement;
      const parts = [...label.children].map((child) =>
        child.getBoundingClientRect(),
      );
      const formBox = form.getBoundingClientRect();
      const middle = formBox.left + formBox.width / 2;
      const button = form
        .querySelector('button[type="submit"]')!
        .getBoundingClientRect();
      const left = Math.min(...parts.map((part) => part.left));
      const right = Math.max(...parts.map((part) => part.right));
      return {
        consentDx: (left + right) / 2 - middle,
        consentLeft: left - formBox.left,
        textAlign: getComputedStyle(label).textAlign,
        buttonDx: button.left + button.width / 2 - middle,
        buttonLeft: button.left - formBox.left,
      };
    });
  for (const width of [1023, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const centered = await read();
    expect(Math.abs(centered.consentDx)).toBeLessThanOrEqual(2);
    expect(Math.abs(centered.buttonDx)).toBeLessThanOrEqual(1);
    expect(centered.textAlign).toBe("center");
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const start = await read();
    expect(Math.abs(start.consentLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(start.buttonLeft)).toBeLessThanOrEqual(1);
    expect(["start", "left"]).toContain(start.textAlign);
  }
});

test("up to 1023px the sections NEWS, PIPELINE, TOOLS and CONTACT have a narrower gap between their parts, and INVERSION keeps the wide one", async ({
  page,
}) => {
  const gaps = () =>
    page.evaluate(() =>
      ["inversion", "news", "pipeline", "tools", "contact"].map(
        (id) =>
          getComputedStyle(document.querySelector(`#${id} > div`)!).rowGap,
      ),
    );
  for (const width of [1023, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await gaps()).toEqual(["48px", "24px", "24px", "24px", "24px"]);
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await gaps()).toEqual(["48px", "48px", "48px", "48px", "48px"]);
  }
});

test("every text of the footer has the text size of the privacy policy link, at every screen size", async ({
  page,
}) => {
  for (const width of [1440, 1024, 1023, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const sizes = await page.evaluate(() => {
      const footer = document.querySelector("footer") as HTMLElement;
      const link = footer.querySelector("a") as HTMLElement;
      return {
        link: parseFloat(getComputedStyle(link).fontSize),
        texts: [...footer.querySelectorAll("p")].map((paragraph) =>
          parseFloat(getComputedStyle(paragraph).fontSize),
        ),
      };
    });
    expect(sizes.link).toBe(12);
    expect(sizes.texts).toHaveLength(2);
    for (const size of sizes.texts) expect(size).toBe(sizes.link);
  }
});

test("up to 1023px each part of the footer is centered from left to right", async ({
  page,
}) => {
  for (const width of [1023, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const offsets = await page.evaluate(() => {
      const footer = document.querySelector("footer") as HTMLElement;
      const middle = footer.getBoundingClientRect().width / 2;
      const parts = [
        ...footer.querySelectorAll("p"),
        footer.querySelector("a") as HTMLElement,
      ];
      return parts.map((part) => {
        const box = part.getBoundingClientRect();
        return box.left + box.width / 2 - middle;
      });
    });
    expect(offsets).toHaveLength(3);
    for (const offset of offsets)
      expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  }
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const parts = page.locator("footer p");
    const first = await boxOf(parts.nth(0));
    const second = await boxOf(parts.nth(1));
    expect(second.x).toBeGreaterThan(first.x + first.width - 1);
    const style = await page.evaluate(() => {
      const frame = document.querySelector("footer > div") as HTMLElement;
      const links = frame.lastElementChild as HTMLElement;
      return {
        textAlign: getComputedStyle(frame).textAlign,
        frameItems: getComputedStyle(frame).alignItems,
        linksItems: getComputedStyle(links).alignItems,
      };
    });
    expect(["start", "left"]).toContain(style.textAlign);
    expect(style.frameItems).toBe("flex-start");
    expect(style.linksItems).toBe("flex-end");
  }
});

const headingSizes = (page: Page, id: string) =>
  page.evaluate((sectionId) => {
    const scope = document.querySelector(`#${sectionId}`) as HTMLElement;
    const header = scope.querySelector("header") as HTMLElement;
    const [label, title, subtitle] = [
      header.querySelector("p:first-of-type"),
      header.querySelector("h1, h2"),
      header.querySelector("h1, h2")?.nextElementSibling,
    ].map((element) =>
      parseFloat(getComputedStyle(element as HTMLElement).fontSize),
    );
    return { label, title, subtitle, width: header.clientWidth };
  }, id);

test("up to 1023px only the hero heading is enlarged to 1.5 times, capped to fit its width", async ({
  page,
}) => {
  const cases = [
    { width: 1023, title: 72 },
    { width: 768, title: 72 },
    { width: 767, title: 54 },
    { width: 600, title: 54 },
    { width: 375, title: 54 },
    { width: 320, title: 54 },
  ];
  for (const { width, title } of cases) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const hero = await headingSizes(page, "hero");
    expect(hero.label).toBeCloseTo(Math.min(18, hero.width * 0.098), 1);
    expect(hero.title).toBeCloseTo(Math.min(title, hero.width * 0.156), 1);
    expect(hero.subtitle).toBe(21);

    const plainTitle = width >= 768 ? 48 : 36;
    for (const id of ["inversion", "news", "pipeline", "tools", "contact"]) {
      const sizes = await headingSizes(page, id);
      expect(sizes.label).toBe(12);
      expect(sizes.title).toBe(plainTitle);
      expect(sizes.subtitle).toBe(14);
    }
  }
});

test("from 1024px every heading keeps its own sizes, the hero heading too", async ({
  page,
}) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const id of [
      "hero",
      "inversion",
      "news",
      "pipeline",
      "tools",
      "contact",
    ]) {
      const sizes = await headingSizes(page, id);
      expect(sizes.label).toBe(12);
      expect(sizes.title).toBe(48);
      expect(sizes.subtitle).toBe(14);
    }
  }
});

test("up to 1023px no heading text sticks out of its header, and the page never scrolls sideways", async ({
  page,
}) => {
  for (const width of [1023, 768, 767, 600, 520, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const stuckOut = await page.evaluate(() =>
      [...document.querySelectorAll("section > header, section header")]
        .flatMap((header) => [...header.querySelectorAll("p, h1, h2")])
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => element.textContent),
    );
    expect(stuckOut).toEqual([]);
    const sideways = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(sideways).toBe(false);
  }
});

test("from 1024px the hero heading starts where the section headings start", async ({
  page,
}) => {
  for (const width of [1920, 1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const hero = await boxOf(page.getByRole("heading", { level: 1 }));
    const section = await boxOf(
      page.getByRole("heading", { level: 2 }).first(),
    );
    expect(Math.abs(hero.x - section.x)).toBeLessThanOrEqual(1);
  }
});

test("the pagers of the news list and the tools table sit at the left edge of their list", async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/");

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
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/");
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
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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

const statementHeightInLines = (page: Page, index: number) =>
  page
    .locator("#inversion p.font-bold")
    .nth(index)
    .evaluate((paragraph) => {
      const lineHeight = Math.max(
        ...[...paragraph.children].map((child) =>
          parseFloat(getComputedStyle(child).lineHeight),
        ),
      );
      return Math.round(paragraph.getBoundingClientRect().height / lineHeight);
    });

test("both statements are one line each at every screen size, starting at the left edge of the area from 1024px", async ({
  page,
}) => {
  for (const width of [
    2560, 1920, 1440, 1280, 1024, 1023, 768, 600, 375, 320,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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

test("the section frames keep 48px of side padding on every screen size", async ({
  page,
}) => {
  for (const width of [320, 375, 519, 520, 767, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const paddings = await page
      .locator(
        ["inversion", "news", "pipeline", "tools", "contact"]
          .map((id) => `#${id} > div`)
          .join(", "),
      )
      .evaluateAll((frames) =>
        frames.map((frame) => {
          const style = getComputedStyle(frame);
          return [
            parseFloat(style.paddingLeft),
            parseFloat(style.paddingRight),
          ];
        }),
      );
    expect(paddings).toHaveLength(5);
    for (const [left, right] of paddings) {
      expect(left).toBe(48);
      expect(right).toBe(48);
    }
    const headingX = await page
      .locator("#inversion h2")
      .evaluate((heading) => heading.getBoundingClientRect().left);
    if (width >= 1024)
      expect(headingX).toBe(Math.max(0, (width - 1280) / 2) + 48);
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
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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
