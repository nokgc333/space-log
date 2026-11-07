import { type Locator, type Page } from "@playwright/test";

export type Box = { x: number; y: number; width: number; height: number };

export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element is not visible");
  return box;
}

export const stageFit = async (page: Page) => {
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

export const statementHeightInLines = (page: Page, index: number) =>
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
