import { expect, test, type Locator } from "@playwright/test";

import { contact } from "@content/sections/contact";

import { privacy } from "@content/privacy";
import { site } from "@content/site";

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element is not visible");
  return box;
}

test("the footer link of the home page opens the privacy policy", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("footer")
    .getByRole("link", { name: site.footer.privacyLabel })
    .click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    privacy.title,
  );
  for (const section of privacy.sections) {
    await expect(
      page.getByRole("heading", { level: 2, name: section.heading }),
    ).toBeVisible();
  }
});

test("the header nav of the privacy page leads to the sections of the home page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/privacy");
  const item = site.nav[1];
  await page
    .getByRole("banner")
    .first()
    .getByRole("link", { name: item.label })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${item.href}$`));
  await expect(page.locator(item.href)).toBeVisible();
});

test("the back link leads to the top of the home page", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByRole("link", { name: privacy.backLabel }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the skip link lands on the main content", async ({ page }) => {
  await page.goto("/privacy");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: site.skipLabel })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("reads as one column from top to bottom, with the title centered", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/privacy");
  const title = await boxOf(page.getByRole("heading", { level: 1 }));
  const first = await boxOf(
    page.getByRole("heading", { level: 2, name: privacy.sections[0].heading }),
  );
  const second = await boxOf(
    page.getByRole("heading", { level: 2, name: privacy.sections[1].heading }),
  );
  const lead = await boxOf(page.getByText(privacy.lead));
  const back = await boxOf(page.getByRole("link", { name: privacy.backLabel }));

  expect(title.y + title.height).toBeLessThanOrEqual(lead.y);
  expect(lead.y + lead.height).toBeLessThanOrEqual(first.y);
  expect(first.y + first.height).toBeLessThanOrEqual(second.y);
  expect(second.y + second.height).toBeLessThanOrEqual(back.y);

  expect(Math.abs(lead.x - first.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(first.x - second.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(first.x - back.x)).toBeLessThanOrEqual(1);

  const viewportCenter = 1440 / 2;
  expect(
    Math.abs(title.x + title.width / 2 - viewportCenter),
  ).toBeLessThanOrEqual(1);
  expect(lead.width).toBeLessThanOrEqual(768);
  expect(lead.width).toBeGreaterThan(400);
});

test("the text of every chapter lines up with the lead", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/privacy");
  const lead = await boxOf(page.getByText(privacy.lead));
  for (const section of privacy.sections) {
    const heading = await boxOf(
      page.getByRole("heading", { level: 2, name: section.heading }),
    );
    expect(Math.abs(heading.x - lead.x)).toBeLessThanOrEqual(1);
  }
});

test("fits a phone without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/privacy");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("what the policy states about cookies and storage", () => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.88" } });

  test("holds: no cookie is set, and only the display setting is stored", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page
      .getByRole("banner")
      .first()
      .getByRole("button", { name: site.themeLabel })
      .click();

    const field = (name: keyof typeof contact.fields) =>
      page.getByLabel(new RegExp(`^${contact.fields[name]}`));
    await field("name").fill("山田 太郎");
    await field("email").fill("taro@example.com");
    await field("topic").selectOption(contact.topics[0].value);
    await field("message").fill("確認です");
    await field("consent").check();
    await page.getByRole("button", { name: contact.submit }).click();
    await expect(page.getByRole("status")).toHaveText(/\S/);

    await page.goto("/privacy");

    expect(await context.cookies()).toEqual([]);
    const stored = await page.evaluate(() => Object.keys(localStorage));
    expect(stored).toEqual(["theme"]);
  });
});
