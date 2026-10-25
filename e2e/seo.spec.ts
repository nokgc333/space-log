import { expect, test, type Page } from "@playwright/test";

import { privacy } from "@content/privacy";
import { site } from "@content/site";

const meta = (page: Page, selector: string) =>
  page.locator(`head meta[${selector}]`).getAttribute("content");

test("the home page is named after the site and declares itself as its canonical URL", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(site.name);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    site.url,
  );
});

test("the privacy policy takes the site name as a title suffix and its own canonical URL", async ({
  page,
}) => {
  await page.goto("/privacy");

  await expect(page).toHaveTitle(`${privacy.title} | ${site.name}`);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${site.url}/privacy`,
  );
});

test("the home page describes itself for link previews and Twitter cards", async ({
  page,
}) => {
  await page.goto("/");

  expect(await meta(page, 'property="og:title"')).toBe(site.name);
  expect(await meta(page, 'property="og:description"')).toBe(site.description);
  expect(await meta(page, 'property="og:type"')).toBe("website");
  expect(await meta(page, 'property="og:site_name"')).toBe(site.name);
  expect(await meta(page, 'property="og:url"')).toBe(site.url);
  expect(await meta(page, 'property="og:locale"')).toBe("ja_JP");
  expect(await meta(page, 'name="twitter:card"')).toBe("summary_large_image");
  expect(await meta(page, 'name="twitter:title"')).toBe(site.name);
  expect(await meta(page, 'name="twitter:description"')).toBe(site.description);
});

test("the privacy policy keeps the site fields in its link preview", async ({
  page,
}) => {
  await page.goto("/privacy");

  expect(await meta(page, 'property="og:title"')).toBe(
    `${privacy.title} | ${site.name}`,
  );
  expect(await meta(page, 'property="og:site_name"')).toBe(site.name);
  expect(await meta(page, 'property="og:url"')).toBe(`${site.url}/privacy`);
});

test("the home page carries a WebSite description for search engines", async ({
  page,
}) => {
  await page.goto("/");
  const text = await page
    .locator('script[type="application/ld+json"]')
    .textContent();

  expect(JSON.parse(text ?? "")).toEqual({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    description: site.description,
    url: site.url,
    inLanguage: "ja",
  });
});

test("robots.txt keeps crawlers out of a deployment that is not the production one", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");

  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain("User-Agent: *");
  expect(text).toContain("Disallow: /");
  expect(text).not.toContain("Sitemap:");
});

test("sitemap.xml lists the home page and the privacy policy", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");

  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain(`<loc>${site.url}/</loc>`);
  expect(text).toContain(`<loc>${site.url}/privacy</loc>`);
});

test("the home page points link previews and Twitter cards to a 1200 x 630 PNG on the site", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const image = await meta(page, 'property="og:image"');

  expect(image).toMatch(new RegExp(`^${site.url}/opengraph-image`));
  expect(await meta(page, 'property="og:image:width"')).toBe("1200");
  expect(await meta(page, 'property="og:image:height"')).toBe("630");
  expect(await meta(page, 'property="og:image:type"')).toBe("image/png");
  expect(await meta(page, 'property="og:image:alt"')).toBeTruthy();
  expect(await meta(page, 'name="twitter:image"')).toMatch(
    new RegExp(`^${site.url}/`),
  );

  const response = await request.get(new URL(image ?? "").pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});

test("the privacy policy shows the same link preview image as the home page", async ({
  page,
  request,
}) => {
  const bytesOf = async (path: string) => {
    await page.goto(path);
    const image = await meta(page, 'property="og:image"');
    const response = await request.get(new URL(image ?? "").pathname);
    expect(response.status(), path).toBe(200);
    return response.body();
  };

  const home = await bytesOf("/");
  const privacy = await bytesOf("/privacy");

  expect(privacy.equals(home)).toBe(true);
});

test("the page offers a favicon and an Apple touch icon that load as PNG images", async ({
  page,
  request,
}) => {
  await page.goto("/");

  for (const rel of ["icon", "apple-touch-icon"]) {
    const href = await page
      .locator(`head link[rel="${rel}"]`)
      .first()
      .getAttribute("href");
    const response = await request.get(href ?? "");

    expect(response.status(), rel).toBe(200);
    expect(response.headers()["content-type"], rel).toBe("image/png");
  }
});

test("the browser bar takes the light or dark surface color of the site, and the manifest names the site", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const colors = await page
    .locator('head meta[name="theme-color"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => [
        node.getAttribute("media"),
        node.getAttribute("content"),
      ]),
    );

  expect(colors).toEqual([
    ["(prefers-color-scheme: light)", "#ffffff"],
    ["(prefers-color-scheme: dark)", "#050505"],
  ]);
  await expect(page.locator('head link[rel="manifest"]')).toHaveCount(1);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toBe(site.name);
});
