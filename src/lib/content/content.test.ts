import { describe, expect, it } from "vitest";

import { inversion as rawInversion } from "@content/sections/inversion";
import { site as rawSite } from "@content/site";

import { hero, inversion, site } from "./index";
import { inversionSchema, siteSchema } from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [site, hero, inversion];
    for (const section of sections) expect(section).toBeDefined();
  });

  it("rejects a site url that is not a url", () => {
    const broken = { ...rawSite, url: "example.test" };
    expect(siteSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an empty site name", () => {
    expect(siteSchema.safeParse({ ...rawSite, name: "" }).success).toBe(false);
  });

  describe("inversion statements", () => {
    const withBody = (body: unknown) => ({ ...rawInversion, body });

    it("accepts a statement with a lead and a highlighted phrase", () => {
      const body = [
        { lead: "lead,", main: "main with key words", highlight: "key" },
      ];
      expect(inversionSchema.safeParse(withBody(body)).success).toBe(true);
    });

    it("accepts a statement with only a main text", () => {
      expect(
        inversionSchema.safeParse(withBody([{ main: "only the main" }]))
          .success,
      ).toBe(true);
    });

    it("accepts a statement with a tail after the main text", () => {
      const body = [{ main: "main", tail: "and the tail." }];
      expect(inversionSchema.safeParse(withBody(body)).success).toBe(true);
    });

    it("rejects a highlighted phrase that is not in the main text", () => {
      const body = [{ main: "main text", highlight: "elsewhere" }];
      expect(inversionSchema.safeParse(withBody(body)).success).toBe(false);
    });

    it("keeps the real statements free of newlines", () => {
      for (const statement of inversion.body)
        expect(JSON.stringify(statement)).not.toContain("\\n");
    });

    it("highlights a phrase that the real statements contain", () => {
      for (const statement of inversion.body)
        if (statement.highlight)
          expect(statement.main).toContain(statement.highlight);
    });
  });
});
