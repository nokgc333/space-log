import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "./robots";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots", () => {
  it("allows every crawler on the production deployment and points to the sitemap", () => {
    vi.stubEnv("VERCEL_ENV", "production");

    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://space-log.vercel.app/sitemap.xml",
    });
  });

  it("disallows every crawler on a preview deployment and lists no sitemap", () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
