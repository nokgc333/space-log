import { expect, test, type Locator } from "@playwright/test";

import { site } from "@content/site";

import { openAt } from "./viewport";
import { boxOf } from "./helpers";

test("the header shows the full nav from 1024px and the menu button below it", async ({
  page,
}) => {
  for (const width of [768, 1023]) {
    await openAt(page, width, 900);
    await expect(
      page.getByRole("button", { name: site.menuLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: site.nav[0].label }),
    ).toBeHidden();
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 900);
    await expect(
      page.getByRole("button", { name: site.menuLabel }),
    ).toBeHidden();
    await expect(
      page.getByRole("banner").getByRole("link", { name: site.nav[0].label }),
    ).toBeVisible();
  }
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
  await openAt(page, 1440, 900);
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
  await openAt(page, 375, 800);
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
  await openAt(page, 375, 800);
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
