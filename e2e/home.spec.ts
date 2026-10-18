import { expect, test, type Locator } from "@playwright/test";

import { pipeline } from "@content/sections/pipeline";
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
