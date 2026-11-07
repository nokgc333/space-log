import { describe, expect, it } from "vitest";

import { isIndexable } from "./indexing";

describe("isIndexable", () => {
  it("lets search engines index the production deployment", () => {
    expect(isIndexable({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("keeps preview deployments out of search results", () => {
    expect(isIndexable({ VERCEL_ENV: "preview" })).toBe(false);
  });

  it("keeps the development deployment out of search results", () => {
    expect(isIndexable({ VERCEL_ENV: "development" })).toBe(false);
  });

  it("keeps a self-hosted or local run out of search results, where the host is unknown", () => {
    expect(isIndexable({})).toBe(false);
  });
});
