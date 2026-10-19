import { expect, test } from "@playwright/test";

import { contact } from "@content/sections/contact";

const EXPECTED_HEADERS = [
  "content-security-policy",
  "permissions-policy",
  "referrer-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
];

test.describe("security headers", () => {
  for (const path of ["/", "/privacy", "/does-not-exist"]) {
    test(`are sent with ${path} and nothing announces the framework`, async ({
      request,
    }) => {
      const response = await request.get(path);
      const headers = response.headers();
      for (const name of EXPECTED_HEADERS) expect(headers[name]).toBeTruthy();
      expect(headers["content-security-policy"]).toContain(
        "frame-ancestors 'none'",
      );
      expect(headers["content-security-policy"]).not.toContain("'unsafe-eval'");
      expect(headers["x-powered-by"]).toBeUndefined();
    });
  }

  test("do not block anything the home page needs", async ({ page }) => {
    const problems: string[] = [];
    await page.addInitScript(() => {
      window.addEventListener("securitypolicyviolation", (event) => {
        console.error(
          `CSP ${event.violatedDirective} blocked ${event.blockedURI}`,
        );
      });
    });
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));

    await page.goto("/");
    const canvas = page.locator("#hero canvas");
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => (await canvas.boundingBox())?.width ?? 0)
      .toBeGreaterThan(1000);
    await page.locator("#contact").scrollIntoViewIfNeeded();

    expect(problems).toEqual([]);
  });
});

test.describe("the contact form under the policy", () => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.77" } });

  test("still sends, with no policy violation", async ({ page }) => {
    const problems: string[] = [];
    await page.addInitScript(() => {
      window.addEventListener("securitypolicyviolation", (event) => {
        console.error(
          `CSP ${event.violatedDirective} blocked ${event.blockedURI}`,
        );
      });
    });
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(error.message));

    await page.goto("/");
    const field = (name: keyof typeof contact.fields) =>
      page.getByLabel(new RegExp(`^${contact.fields[name]}`));
    await field("name").fill("山田 太郎");
    await field("email").fill("taro@example.com");
    await field("topic").selectOption(contact.topics[0].value);
    await field("message").fill("表示確認です");
    await field("consent").check();
    await page.getByRole("button", { name: contact.submit }).click();

    await expect(page.getByRole("status")).toHaveText(/\S/);
    await expect(field("name")).toHaveValue("");
    expect(problems).toEqual([]);
  });
});
