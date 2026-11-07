import { describe, expect, it } from "vitest";

import { site as rawSite } from "@content/site";

import { site } from "./index";
import { siteSchema } from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [site];
    for (const section of sections) expect(section).toBeDefined();
  });

  it("rejects a site url that is not a url", () => {
    const broken = { ...rawSite, url: "example.test" };
    expect(siteSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an empty site name", () => {
    expect(siteSchema.safeParse({ ...rawSite, name: "" }).success).toBe(false);
  });
});
