import { expect, test } from "@playwright/test";

import { site } from "@content/site";

import { openAt } from "./viewport";
import { boxOf } from "./helpers";

test("the header and the sections share the same edges from the md breakpoint, and the footer from 1024px", async ({
  page,
}) => {
  for (const width of [1920, 1440, 1024, 768]) {
    await openAt(page, width, 900);

    const logo = await boxOf(
      page.getByRole("banner").getByRole("link", { name: site.name }),
    );
    const heading = await boxOf(
      page.getByRole("heading", { level: 2 }).first(),
    );
    const footerText = await boxOf(page.locator("footer p").first());
    const contentLeft = await page.evaluate(() => {
      const frame = document.querySelector("#news > div") as HTMLElement;
      return (
        frame.getBoundingClientRect().left +
        parseFloat(getComputedStyle(frame).paddingLeft)
      );
    });
    expect(Math.abs(logo.x - contentLeft)).toBeLessThanOrEqual(1);
    if (width >= 1024) {
      expect(Math.abs(logo.x - heading.x)).toBeLessThanOrEqual(1);
    }
    if (width >= 1024)
      expect(Math.abs(footerText.x - heading.x)).toBeLessThanOrEqual(1);

    const rightmost = await boxOf(
      page.getByRole("banner").getByRole("button", {
        name: width < 1024 ? site.menuLabel : site.themeLabel,
      }),
    );
    const list = await boxOf(page.locator("#news ol"));
    expect(
      Math.abs(rightmost.x + rightmost.width - (list.x + list.width)),
    ).toBeLessThanOrEqual(1);
  }
});

test("from 1024px the heading column sits beside the content, and up to 1023px they are stacked", async ({
  page,
}) => {
  for (const width of [768, 900, 1023]) {
    await openAt(page, width, 900);
    const heading = await boxOf(page.locator("#news h2"));
    const list = await boxOf(page.locator("#news ol"));
    const contentLeft = await page.evaluate(() => {
      const frame = document.querySelector("#news > div") as HTMLElement;
      return (
        frame.getBoundingClientRect().left +
        parseFloat(getComputedStyle(frame).paddingLeft)
      );
    });
    expect(Math.abs(list.x - contentLeft)).toBeLessThanOrEqual(1);
    expect(list.y).toBeGreaterThan(heading.y + heading.height);
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 900);
    const heading = await boxOf(page.locator("#news h2"));
    const list = await boxOf(page.locator("#news ol"));
    expect(list.x).toBeGreaterThan(heading.x + 200);
  }
});

test("the footer lines its parts up in a row from 1024px and stacks them below it", async ({
  page,
}) => {
  for (const width of [768, 1023]) {
    await openAt(page, width, 900);
    const parts = page.locator("footer p");
    const [first, second] = [
      await boxOf(parts.nth(0)),
      await boxOf(parts.nth(1)),
    ];
    expect(second.y).toBeGreaterThan(first.y + first.height - 1);
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 900);
    const parts = page.locator("footer p");
    const [first, second] = [
      await boxOf(parts.nth(0)),
      await boxOf(parts.nth(1)),
    ];
    expect(second.x).toBeGreaterThan(first.x + first.width - 1);
  }
});

test("up to 1023px the hero content is centered both ways and its text is centered", async ({
  page,
}) => {
  for (const width of [1023, 768, 375, 320]) {
    await openAt(page, width, 800);
    const centers = await page.evaluate(() => {
      const section = document.querySelector("#hero") as HTMLElement;
      const header = document.querySelector("#hero header") as HTMLElement;
      const box = section.getBoundingClientRect();
      const head = header.getBoundingClientRect();
      return {
        dx: head.left + head.width / 2 - (box.left + box.width / 2),
        dy: head.top + head.height / 2 - (box.top + box.height / 2),
        align: getComputedStyle(header).textAlign,
      };
    });
    expect(Math.abs(centers.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(centers.dy)).toBeLessThanOrEqual(8);
    expect(centers.align).toBe("center");
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 800);
    const wide = await page.evaluate(() => {
      const section = document.querySelector("#hero") as HTMLElement;
      const header = document.querySelector("#hero header") as HTMLElement;
      const box = section.getBoundingClientRect();
      const head = header.getBoundingClientRect();
      return {
        align: getComputedStyle(header).textAlign,
        dy: head.top + head.height / 2 - (box.top + box.height / 2),
      };
    });
    expect(["start", "left"]).toContain(wide.align);
    expect(wide.dy).toBeGreaterThan(100);
  }
});
