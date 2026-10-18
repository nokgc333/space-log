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

  test("can be sent with the keyboard alone, from the last field to the button", async ({
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
