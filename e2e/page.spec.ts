import { expect, test, type Page } from "@playwright/test";

import { hero } from "@content/sections/hero";
import { pipeline } from "@content/sections/pipeline";
import { site } from "@content/site";

import { openAt } from "./viewport";

test("the page declares Japanese, and takes its title and description from the site content", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page).toHaveTitle(site.name);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    site.description,
  );
});

test("the three font families of the design are applied to the text, the titles and the code-like labels", async ({
  page,
}) => {
  await page.goto("/");
  const families = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    title: getComputedStyle(document.querySelector("#news h2") as HTMLElement)
      .fontFamily,
    label: getComputedStyle(document.querySelector("footer a") as HTMLElement)
      .fontFamily,
  }));
  expect(families.body).toContain("IBM Plex Sans JP");
  expect(families.title).toContain("IBM Plex Sans Condensed");
  expect(families.label).toContain("IBM Plex Mono");
});

test("the home page shows one top-level heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
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
  await openAt(page, 320, 640);
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
  await openAt(page, 1440, 900);
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
