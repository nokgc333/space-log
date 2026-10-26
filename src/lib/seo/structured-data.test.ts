import { describe, expect, it } from "vitest";

import { buildWebSiteJsonLd, serializeJsonLd } from "./structured-data";

const site = {
  name: "Example Studio",
  description: "A fictional studio.",
  url: "https://example.test",
};

describe("buildWebSiteJsonLd", () => {
  it("describes the site as a schema.org WebSite", () => {
    expect(buildWebSiteJsonLd(site)).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Example Studio",
      description: "A fictional studio.",
      url: "https://example.test",
      inLanguage: "ja",
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes characters that could close the script element or start markup", () => {
    const text = serializeJsonLd({ name: "</script><b>&" });

    expect(text).not.toMatch(/[<>&]/);
    expect(JSON.parse(text)).toEqual({ name: "</script><b>&" });
  });

  it("escapes the line separators that older parsers treat as line breaks", () => {
    const text = serializeJsonLd({ name: `a${String.fromCharCode(0x2028)}b` });

    expect(text).not.toContain(String.fromCharCode(0x2028));
    expect(JSON.parse(text).name).toBe(`a${String.fromCharCode(0x2028)}b`);
  });
});
