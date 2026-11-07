import { describe, expect, it } from "vitest";

import { site } from "@/lib/content";

import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists the home page and the privacy policy with absolute URLs", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      `${site.url}/`,
      `${site.url}/privacy`,
    ]);
  });
});
