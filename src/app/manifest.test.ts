import { describe, expect, it } from "vitest";

import { BRAND_COLORS } from "@/lib/seo/brand-colors";
import { site } from "@/lib/content";

import manifest from "./manifest";

describe("manifest", () => {
  it("names the site, its language and where it starts", () => {
    expect(manifest()).toMatchObject({
      name: site.name,
      short_name: site.name,
      description: site.description,
      lang: "ja",
      start_url: "/",
    });
  });

  it("uses the dark brand colors for the splash and the browser bar", () => {
    expect(manifest()).toMatchObject({
      background_color: BRAND_COLORS.dark.surface,
      theme_color: BRAND_COLORS.dark.surface,
    });
  });
});
