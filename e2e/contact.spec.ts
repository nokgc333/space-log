import { expect, test, type Page } from "@playwright/test";

import { contact } from "@content/sections/contact";

import { openAt } from "./viewport";
import { uniqueVisitorHeaders } from "./visitor";

const field = (page: Page, name: keyof typeof contact.fields) =>
  page.getByLabel(new RegExp(`^${contact.fields[name]}`));

async function fillValid(page: Page) {
  await field(page, "name").fill("山田 太郎");
  await field(page, "email").fill("taro@example.com");
  await field(page, "topic").selectOption(contact.topics[0].value);
  await field(page, "message").fill("相談です");
  await field(page, "consent").check();
}

const outcome = (page: Page, role: "status" | "alert") =>
  page.locator("#contact").getByRole(role);

const send = (page: Page) =>
  page.getByRole("button", { name: contact.submit }).click();

function countActionPosts(page: Page) {
  const counter = { value: 0 };
  page.on("request", (request) => {
    if (request.method() === "POST") counter.value += 1;
  });
  return counter;
}

test("the arrow of the topic select is inset from the right edge as far as its text is from the left edge, and a click on it still reaches the select", async ({
  page,
}) => {
  for (const width of [1440, 768, 375]) {
    await openAt(page, width, 900);
    const select = field(page, "topic");
    await select.scrollIntoViewIfNeeded();
    const measured = await select.evaluate((element) => {
      const arrow = element.parentElement?.querySelector("svg") as SVGElement;
      const box = element.getBoundingClientRect();
      const arrowBox = arrow.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        rightGap: box.right - arrowBox.right,
        leftInset:
          parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth),
        dy: arrowBox.top + arrowBox.height / 2 - (box.top + box.height / 2),
        arrowColor: getComputedStyle(arrow).color,
        selectColor: style.color,
        textRoom: parseFloat(style.paddingRight) - arrowBox.width,
        x: arrowBox.left + arrowBox.width / 2,
        y: arrowBox.top + arrowBox.height / 2,
      };
    });
    expect(
      Math.abs(measured.rightGap - measured.leftInset),
    ).toBeLessThanOrEqual(1.5);
    expect(Math.abs(measured.dy)).toBeLessThanOrEqual(1);
    expect(measured.arrowColor).toBe(measured.selectColor);
    expect(measured.textRoom).toBeGreaterThanOrEqual(16);

    await page.mouse.click(measured.x, measured.y);
    await expect(select).toBeFocused();
    await page.keyboard.press("Escape");
  }
});

test("the form keeps its field spacing, the plain look of the select, and the alignment of the consent line and the button", async ({
  page,
}) => {
  for (const width of [1440, 375]) {
    await openAt(page, width, 900);
    const form = await page.evaluate(() => {
      const select = document.querySelector("#contact-topic") as HTMLElement;
      const selectStyle = getComputedStyle(select);
      const fields = ["contact-name", "contact-email", "contact-message"].map(
        (id) =>
          parseFloat(
            getComputedStyle(document.getElementById(id) as HTMLElement)
              .marginTop,
          ),
      );
      const label = document.querySelector(
        "#contact label.flex",
      ) as HTMLElement;
      const button = document.querySelector(
        '#contact button[type="submit"]',
      ) as HTMLElement;
      return {
        appearance: selectStyle.appearance,
        selectGap: parseFloat(
          getComputedStyle(select.parentElement as HTMLElement).marginTop,
        ),
        fields,
        consentAlign: getComputedStyle(label).alignItems,
        buttonAlign: getComputedStyle(button).alignSelf,
      };
    });
    expect(form.appearance).toBe("none");
    expect(form.selectGap).toBe(8);
    for (const gap of form.fields) expect(gap).toBe(8);
    expect(form.consentAlign).toBe("center");
    expect(form.buttonAlign).toBe(width >= 1024 ? "flex-start" : "center");
  }
});

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders(uniqueVisitorHeaders());
});

test.describe("the contact form", () => {
  test("accepts a valid entry in demo mode and empties itself", async ({
    page,
  }) => {
    await page.goto("/#contact");
    await fillValid(page);
    await send(page);
    await expect(outcome(page, "status")).toHaveText(contact.results.demo);
    await expect(field(page, "name")).toHaveValue("");
    await expect(field(page, "consent")).not.toBeChecked();
  });

  test("shows a message for every missing answer and sends nothing", async ({
    page,
  }) => {
    const posts = countActionPosts(page);
    await page.goto("/#contact");
    await send(page);
    await expect(page.getByText(contact.messages.required)).toHaveCount(3);
    await expect(page.getByText(contact.messages.choose)).toBeVisible();
    await expect(page.getByText(contact.messages.consent)).toBeVisible();
    await expect(outcome(page, "status")).toHaveCount(0);
    expect(posts.value).toBe(0);
  });

  test("refuses a wrong email address and sends nothing", async ({ page }) => {
    const posts = countActionPosts(page);
    await page.goto("/#contact");
    await fillValid(page);
    await field(page, "email").fill("taro@");
    await send(page);
    await expect(page.getByText(contact.messages.email)).toBeVisible();
    await expect(field(page, "email")).toHaveAttribute("aria-invalid", "true");
    expect(posts.value).toBe(0);
  });
});
