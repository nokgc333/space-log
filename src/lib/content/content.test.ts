import { describe, expect, it } from "vitest";

import { inversion as rawInversion } from "@content/sections/inversion";
import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { tools as rawTools } from "@content/sections/tools";
import { site as rawSite } from "@content/site";

import { hero, inversion, news, pipeline, site, tools } from "./index";
import {
  inversionSchema,
  newsSchema,
  pipelineSchema,
  siteSchema,
  toolsSchema,
} from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [site, hero, inversion, news, pipeline, tools];
    for (const section of sections) expect(section).toBeDefined();
  });

  it("rejects a news section that shows no entries per page", () => {
    const broken = { ...rawNews, perPage: 0 };
    expect(newsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a news section with a page size that is not a whole number", () => {
    const broken = { ...rawNews, perPage: 2.5 };
    expect(newsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a news section without labels for the pager buttons", () => {
    const broken = { ...rawNews, pager: undefined };
    expect(newsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects two pipeline stages with the same id", () => {
    const first = rawPipeline.stages[0];
    const broken = { ...rawPipeline, stages: [first, first] };
    expect(pipelineSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects two tools with the same id", () => {
    const first = rawTools.entries[0];
    const broken = { ...rawTools, entries: [first, first] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("accepts a tool without a repository url", () => {
    const entry = { ...rawTools.entries[0], repoUrl: undefined };
    const ok = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(ok).success).toBe(true);
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
