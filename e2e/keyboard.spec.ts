import { expect, test, type Page } from "@playwright/test";

import { site } from "@content/site";

import { openAt } from "./viewport";

const MAX_STOPS = 120;
const MIN_RING_WIDTH = 2;
const MIN_RING_CONTRAST = 3;

type Stop = {
  name: string;
  tag: string;
  outlineStyle: string;
  outlineWidth: number;
  outlineColor: string;
  surface: string;
  isInView: boolean;
};

async function tabThroughPage(page: Page): Promise<Stop[]> {
  const stops: Stop[] = [];
  for (let index = 0; index < MAX_STOPS; index++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate((count) => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      if (element.dataset.tabStop) return "again";
      element.dataset.tabStop = String(count);
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        name: (element.getAttribute("aria-label") ?? element.textContent ?? "")
          .trim()
          .slice(0, 40),
        tag: element.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        outlineColor: style.outlineColor,
        surface: getComputedStyle(document.body).backgroundColor,
        isInView: box.width > 0 && box.height > 0,
      };
    }, index);
    if (stop === null || stop === "again") break;
    stops.push(stop);
  }
  return stops;
}

function luminance(color: string): number {
  const [r, g, b] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  const linear = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function expectVisibleRing(stop: Stop) {
  expect(stop.isInView, stop.name).toBe(true);
  expect(stop.outlineStyle, stop.name).not.toBe("none");
  expect(stop.outlineWidth, stop.name).toBeGreaterThanOrEqual(MIN_RING_WIDTH);
  expect(
    contrast(stop.outlineColor, stop.surface),
    stop.name,
  ).toBeGreaterThanOrEqual(MIN_RING_CONTRAST);
}

for (const theme of ["light", "dark"] as const) {
  test(`every Tab stop of the home page shows a focus ring that stands out from the ${theme} page`, async ({
    page,
  }) => {
    await page.addInitScript((value) => {
      localStorage.setItem("theme", value);
    }, theme);
    await openAt(page, 1440, 900, "/");

    const stops = await tabThroughPage(page);

    expect(stops.length).toBeGreaterThan(20);
    for (const stop of stops) expectVisibleRing(stop);
  });
}

test("every Tab stop of the privacy page shows a focus ring", async ({
  page,
}) => {
  await openAt(page, 1440, 900, "/privacy");

  const stops = await tabThroughPage(page);

  expect(stops.length).toBeGreaterThan(5);
  for (const stop of stops) expectVisibleRing(stop);
});

test("the first Tab stop is the skip link, and it leads to the main content", async ({
  page,
}) => {
  await openAt(page, 1440, 900, "/");

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: site.skipLabel });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("the Tab order starts with the skip link, the logo, the section links and the theme switch", async ({
  page,
}) => {
  await openAt(page, 1440, 900, "/");

  const stops = await tabThroughPage(page);

  expect(stops.slice(0, 3 + site.nav.length).map((stop) => stop.name)).toEqual([
    site.skipLabel,
    site.name,
    ...site.nav.map((item) => item.label),
    site.themeLabel,
  ]);
});

test("under forced colors the focus ring stays visible on every Tab stop", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openAt(page, 1440, 900, "/");

  const stops = await tabThroughPage(page);

  expect(stops.length).toBeGreaterThan(20);
  for (const stop of stops) expectVisibleRing(stop);
});

test("when the visitor asks for less motion, nothing animates or eases and the page jumps instead of scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAt(page, 1440, 900, "/");

  const motion = await page.evaluate(() => {
    const longest = (values: string[]) =>
      Math.max(
        ...values.flatMap((value) =>
          value.split(",").map((part) => {
            const seconds = Number.parseFloat(part);
            return part.trim().endsWith("ms") ? seconds / 1000 : seconds;
          }),
        ),
      );
    const all = [...document.querySelectorAll("*")].map((element) =>
      getComputedStyle(element),
    );
    return {
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
      transition: longest(all.map((style) => style.transitionDuration)),
      animation: longest(all.map((style) => style.animationDuration)),
    };
  });

  expect(motion.scroll).toBe("auto");
  expect(motion.transition).toBeLessThan(0.001);
  expect(motion.animation).toBeLessThan(0.001);
  await expect(page.locator("#hero")).toHaveAttribute("data-motion", "reduced");
});

test("when the visitor asks for more contrast, the quiet text and borders get darker", async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return [
        style.getPropertyValue("--muted"),
        style.getPropertyValue("--control"),
      ];
    });
  await openAt(page, 1440, 900, "/");
  const normal = await read();

  await page.emulateMedia({ contrast: "more" });
  const more = await read();

  expect(more).not.toEqual(normal);
  const surface = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  const hex = (value: string) => {
    const n = Number.parseInt(value.trim().slice(1), 16);
    return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
  };
  expect(contrast(hex(more[0]), surface)).toBeGreaterThanOrEqual(7);
});
