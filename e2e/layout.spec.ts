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

test("up to 1023px every section header and its text are centered from left to right, and start at the left edge from 1024px", async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() =>
      ["inversion", "news", "pipeline", "tools", "contact"].map((id) => {
        const frame = document.querySelector(`#${id} > div`) as HTMLElement;
        const header = frame.querySelector("header") as HTMLElement;
        const style = getComputedStyle(frame);
        const left =
          frame.getBoundingClientRect().left + parseFloat(style.paddingLeft);
        const width =
          frame.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        const box = header.getBoundingClientRect();
        return {
          dx: box.left + box.width / 2 - (left + width / 2),
          startGap: box.left - left,
          align: getComputedStyle(header).textAlign,
        };
      }),
    );
  for (const width of [1023, 768, 375, 320]) {
    await openAt(page, width, 900);
    for (const header of await read()) {
      expect(Math.abs(header.dx)).toBeLessThanOrEqual(1);
      expect(header.align).toBe("center");
    }
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 900);
    for (const header of await read()) {
      expect(Math.abs(header.startGap)).toBeLessThanOrEqual(1);
      expect(["start", "left"]).toContain(header.align);
    }
  }
});

test("up to 1023px the consent line and the send button of CONTACT are centered from left to right", async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() => {
      const form = document.querySelector("#contact form") as HTMLElement;
      const label = form.querySelector("label.flex") as HTMLElement;
      const parts = [...label.children].map((child) =>
        child.getBoundingClientRect(),
      );
      const formBox = form.getBoundingClientRect();
      const middle = formBox.left + formBox.width / 2;
      const button = form
        .querySelector('button[type="submit"]')!
        .getBoundingClientRect();
      const left = Math.min(...parts.map((part) => part.left));
      const right = Math.max(...parts.map((part) => part.right));
      return {
        consentDx: (left + right) / 2 - middle,
        consentLeft: left - formBox.left,
        textAlign: getComputedStyle(label).textAlign,
        buttonDx: button.left + button.width / 2 - middle,
        buttonLeft: button.left - formBox.left,
      };
    });
  for (const width of [1023, 768, 375, 320]) {
    await openAt(page, width, 900);
    const centered = await read();
    expect(Math.abs(centered.consentDx)).toBeLessThanOrEqual(2);
    expect(Math.abs(centered.buttonDx)).toBeLessThanOrEqual(1);
    expect(centered.textAlign).toBe("center");
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 900);
    const start = await read();
    expect(Math.abs(start.consentLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(start.buttonLeft)).toBeLessThanOrEqual(1);
    expect(["start", "left"]).toContain(start.textAlign);
  }
});

test("up to 1023px the sections NEWS, PIPELINE, TOOLS and CONTACT have a narrower gap between their parts, and INVERSION keeps the wide one", async ({
  page,
}) => {
  const gaps = () =>
    page.evaluate(() =>
      ["inversion", "news", "pipeline", "tools", "contact"].map(
        (id) =>
          getComputedStyle(document.querySelector(`#${id} > div`)!).rowGap,
      ),
    );
  for (const width of [1023, 768, 375, 320]) {
    await openAt(page, width, 900);
    expect(await gaps()).toEqual(["48px", "24px", "24px", "24px", "24px"]);
  }
  for (const width of [1024, 1440]) {
    await openAt(page, width, 900);
    expect(await gaps()).toEqual(["48px", "48px", "48px", "48px", "48px"]);
  }
});

test("the header and the footer keep their side padding, and the footer its text alignment and spread", async ({
  page,
}) => {
  const cases = [
    { width: 375, padding: 16 },
    { width: 767, padding: 16 },
    { width: 768, padding: 48 },
    { width: 1023, padding: 48 },
    { width: 1024, padding: 48 },
    { width: 1440, padding: 48 },
  ];
  for (const { width, padding } of cases) {
    await openAt(page, width, 900);
    const frames = await page.evaluate(() => {
      const header = getComputedStyle(
        document.querySelector("header > div") as HTMLElement,
      );
      const footer = getComputedStyle(
        document.querySelector("footer > div") as HTMLElement,
      );
      return {
        headerPadding: parseFloat(header.paddingLeft),
        footerPadding: parseFloat(footer.paddingLeft),
        textAlign: footer.textAlign,
        justify: footer.justifyContent,
      };
    });
    expect(frames.headerPadding).toBe(padding);
    expect(frames.footerPadding).toBe(padding);
    if (width < 1024) {
      expect(frames.textAlign).toBe("center");
    } else {
      expect(["start", "left"]).toContain(frames.textAlign);
      expect(frames.justify).toBe("space-between");
    }
  }
});

test("the section frame and the INVERSION statements keep their gaps and their vertical centering", async ({
  page,
}) => {
  for (const width of [1440, 1024, 375]) {
    await openAt(page, width, 900);
    const values = await page.evaluate(() => {
      const frame = getComputedStyle(
        document.querySelector("#news > div") as HTMLElement,
      );
      const area = getComputedStyle(
        document.querySelector("#inversion p.font-bold")
          ?.parentElement as HTMLElement,
      );
      const [lead, main] = [
        ...(document.querySelector("#inversion p.font-bold")
          ?.children as HTMLCollection),
      ].map((part) => {
        const style = getComputedStyle(part);
        return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
      });
      return {
        columnGap: frame.columnGap,
        rowGap: area.rowGap,
        justify: area.justifyContent,
        lead,
        main,
      };
    });
    if (width >= 1024) expect(values.columnGap).toBe("120px");
    expect(values.rowGap).toBe("40px");
    expect(values.justify).toBe("center");
    expect(values.lead).toBeCloseTo(1.5, 2);
    expect(values.main).toBeCloseTo(1.45, 2);
  }
});
