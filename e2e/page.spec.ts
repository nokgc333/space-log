import { expect, test } from "@playwright/test";

import { site } from "@content/site";

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
