import { describe, expect, it } from "vitest";

import { buildPageMetadata, buildSiteMetadata } from "./site-metadata";

const site = {
  name: "Example Studio",
  description: "A fictional studio.",
  url: "https://example.test",
};

describe("buildSiteMetadata", () => {
  const metadata = buildSiteMetadata(site);

  it("resolves relative URLs against the site URL", () => {
    expect(metadata.metadataBase?.toString()).toBe("https://example.test/");
  });

  it("uses the site name alone for the home page and as a suffix for other pages", () => {
    expect(metadata.title).toEqual({
      default: "Example Studio",
      template: "%s | Example Studio",
    });
  });

  it("declares the home page as its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("/");
  });

  it("describes the page for link previews and keeps the Twitter card in step", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Example Studio",
      title: "Example Studio",
      description: "A fictional studio.",
      url: "/",
      locale: "ja_JP",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Example Studio",
      description: "A fictional studio.",
    });
  });
});

describe("buildPageMetadata", () => {
  const metadata = buildPageMetadata(site, {
    title: "Privacy",
    path: "/privacy",
  });

  it("sets the title and its own canonical path", () => {
    expect(metadata.title).toBe("Privacy");
    expect(metadata.alternates?.canonical).toBe("/privacy");
  });

  it("repeats the site fields in the link preview, because a page replaces the parent's openGraph as a whole", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Example Studio",
      title: "Privacy | Example Studio",
      description: "A fictional studio.",
      url: "/privacy",
      locale: "ja_JP",
    });
  });

  it("keeps the Twitter card in step with the link preview", () => {
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Privacy | Example Studio",
      description: "A fictional studio.",
    });
  });
});
