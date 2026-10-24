import { expect, test } from "@playwright/test";

import { pipeline } from "@content/sections/pipeline";

import { openAt } from "./viewport";
import { Box, boxOf, stageFit } from "./helpers";

test("the stage buttons shrink with the row to show every stage without scrolling sideways", async ({
  page,
}) => {
  for (const width of [1440, 1280, 1100, 1024, 1023, 900, 767, 520, 375, 320]) {
    await openAt(page, width, 900);
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
  await openAt(page, 1440, 900);
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
    await openAt(page, width, 900);
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

test("a pipeline stage can be chosen with the keyboard", async ({ page }) => {
  await page.goto("/#pipeline");
  const buttons = page.locator("#pipeline ol button");
  await buttons.nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "false");
});

test("the PIPELINE stage buttons keep their spacing in proportion to their text", async ({
  page,
}) => {
  for (const width of [1440, 375]) {
    await openAt(page, width, 900);
    const spacing = await page.evaluate(() => {
      const row = document.querySelector("#pipeline ol") as HTMLElement;
      const font = parseFloat(getComputedStyle(row).fontSize);
      const button = getComputedStyle(row.querySelector("button")!);
      const connector = getComputedStyle(row.children[1], "::before");
      return {
        gap: parseFloat(getComputedStyle(row).columnGap) / font,
        padding: parseFloat(button.paddingTop) / font,
        paddingSide: parseFloat(button.paddingLeft) / font,
        connector: parseFloat(connector.width) / font,
      };
    });
    const gap = width >= 768 ? 1.5 : 1;
    expect(spacing.gap).toBeCloseTo(gap, 2);
    expect(spacing.connector).toBeCloseTo(gap, 2);
    expect(spacing.padding).toBeCloseTo(0.75, 2);
    expect(spacing.paddingSide).toBeCloseTo(0.75, 2);
  }
});
