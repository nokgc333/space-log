import { expect, test, type Locator } from "@playwright/test";

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
