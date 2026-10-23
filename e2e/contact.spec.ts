import { expect, test, type Page } from "@playwright/test";

import { contact } from "@content/sections/contact";
import { site } from "@content/site";

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

const consentLink = (page: Page) =>
  page
    .locator("#contact")
    .getByRole("link", { name: contact.consentLink.text });

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
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
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

  test("can be sent with the keyboard alone, from the last field through the privacy link to the button", async ({
    page,
  }) => {
    await page.goto("/#contact");
    await fillValid(page);
    await field(page, "consent").uncheck();
    await field(page, "message").focus();
    await page.keyboard.press("Tab");
    await expect(field(page, "consent")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(field(page, "consent")).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(consentLink(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: contact.submit }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(outcome(page, "status")).toHaveText(contact.results.demo);
  });

  test("cannot be sent twice while the first send is on its way", async ({
    page,
  }) => {
    const posts = countActionPosts(page);
    await page.route("**/", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return route.continue();
    });
    await page.goto("/#contact");
    await fillValid(page);
    await send(page);

    const sending = page.getByRole("button", { name: contact.sending });
    await expect(sending).toBeDisabled();
    await field(page, "message").press("Enter");
    await field(page, "name").press("Enter");
    await expect(outcome(page, "status")).toHaveText(contact.results.demo);
    expect(posts.value).toBe(1);
    await expect(
      page.getByRole("button", { name: contact.submit }),
    ).toBeEnabled();
  });

  test("keeps what was typed and says so when the connection fails", async ({
    page,
  }) => {
    await page.route("**/", (route) =>
      route.request().method() === "POST"
        ? route.abort("failed")
        : route.continue(),
    );
    await page.goto("/#contact");
    await fillValid(page);
    await send(page);
    await expect(outcome(page, "alert")).toHaveText(contact.results.failed);
    await expect(field(page, "name")).toHaveValue("山田 太郎");
    await expect(field(page, "message")).toHaveValue("相談です");
    await expect(field(page, "consent")).toBeChecked();
    await expect(
      page.getByRole("button", { name: contact.submit }),
    ).toBeEnabled();
  });

  test("clears the answer of the last try as soon as the next one starts", async ({
    page,
  }) => {
    let attempt = 0;
    await page.route("**/", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      attempt += 1;
      if (attempt === 1) return route.abort("failed");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return route.continue();
    });
    await page.goto("/#contact");
    await fillValid(page);
    await send(page);
    await expect(outcome(page, "alert")).toHaveText(contact.results.failed);

    await send(page);
    await expect(
      page.getByRole("button", { name: contact.sending }),
    ).toBeDisabled();
    await expect(outcome(page, "alert")).toHaveCount(0, { timeout: 300 });
    await expect(outcome(page, "status")).toHaveText(contact.results.demo);
  });

  test("answers an entry with the hidden trap field filled like any other", async ({
    page,
  }) => {
    await page.goto("/#contact");
    await fillValid(page);
    await page.evaluate(() => {
      const trap = document.querySelector<HTMLInputElement>(
        'input[name="website"]',
      );
      if (!trap) throw new Error("the trap field is missing");
      trap.value = "http://spam.example";
    });
    await send(page);
    await expect(outcome(page, "status")).toHaveText(contact.results.demo);
  });
});

test.describe("the contact form's limit on how often one visitor can send", () => {
  test("turns the sixth entry away within ten minutes, and lets others in", async ({
    page,
    browser,
  }) => {
    await page.goto("/#contact");
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await fillValid(page);
      await send(page);
      await expect(outcome(page, "status")).toHaveText(contact.results.demo);
    }
    await fillValid(page);
    await send(page);
    await expect(outcome(page, "alert")).toHaveText(
      contact.results.rateLimited,
    );
    await expect(field(page, "name")).toHaveValue("山田 太郎");

    const other = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      extraHTTPHeaders: uniqueVisitorHeaders(),
    });
    const otherPage = await other.newPage();
    await otherPage.goto("/#contact");
    await fillValid(otherPage);
    await send(otherPage);
    await expect(outcome(otherPage, "status")).toHaveText(contact.results.demo);
    await other.close();
  });
});

test("the button at the bottom right leads to the contact section", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: site.contactShortcut }).last().click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("the privacy policy in the consent line opens in a new tab and keeps the form as it is", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const link = consentLink(page);
  await expect(link).toHaveAttribute("href", "/privacy");
  await expect(link).toHaveAttribute("target", "_blank");
  await field(page, "name").fill("山田 太郎");

  const [policy] = await Promise.all([
    context.waitForEvent("page"),
    link.click(),
  ]);
  await policy.waitForLoadState();

  await expect(policy).toHaveURL(/\/privacy$/);
  await expect(policy.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(field(page, "name")).toHaveValue("山田 太郎");
  await expect(field(page, "consent")).not.toBeChecked();
});

for (const theme of ["light", "dark"] as const) {
  test(`the consent link is a readable blue and underlined in the ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((value) => {
      localStorage.setItem("theme", value);
    }, theme);
    await page.goto("/");

    const style = await consentLink(page).evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        color: computed.color,
        line: computed.textDecorationLine,
        background: getComputedStyle(document.body).backgroundColor,
      };
    });

    const channels = (rgb: string) =>
      (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    const luminance = ([r, g, b]: number[]) => {
      const part = (value: number) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * part(r) + 0.7152 * part(g) + 0.0722 * part(b);
    };

    const [r, g, b] = channels(style.color);
    expect(style.line).toContain("underline");
    expect(b).toBeGreaterThan(r + 40);
    expect(b).toBeGreaterThan(g);

    const [light, dark] = [
      luminance(channels(style.color)),
      luminance(channels(style.background)),
    ].sort((x, y) => y - x);
    expect((light + 0.05) / (dark + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
}

test("the consent sentence reads as one run of text, with no gap after the link", async ({
  page,
}) => {
  await page.goto("/");
  const gap = await consentLink(page).evaluate((link) => {
    const after = link.nextSibling;
    if (!after) return null;
    const range = document.createRange();
    range.selectNodeContents(after);
    return (
      range.getBoundingClientRect().left - link.getBoundingClientRect().right
    );
  });
  expect(gap).not.toBeNull();
  expect(gap).toBeLessThanOrEqual(2);
});
