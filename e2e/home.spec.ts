import { expect, test, type Locator } from "@playwright/test";

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
