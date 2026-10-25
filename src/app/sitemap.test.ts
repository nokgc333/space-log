import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists the home page and the privacy policy with absolute URLs", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://space-log.vercel.app/",
      "https://space-log.vercel.app/privacy",
    ]);
  });
});
