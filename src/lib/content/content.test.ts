import { describe, expect, it } from "vitest";

import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { tools as rawTools } from "@content/sections/tools";
import { site as rawSite } from "@content/site";

import {
  contact,
  hero,
  inversion,
  news,
  pipeline,
  privacy,
  site,
  tools,
} from "./index";
import { newsSchema, pipelineSchema, siteSchema, toolsSchema } from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [
      site,
      hero,
      inversion,
      news,
      pipeline,
      tools,
      contact,
      privacy,
    ];
    for (const section of sections) expect(section).toBeDefined();
  });

  it("rejects a news section that shows no entries on the home page", () => {
    const broken = { ...rawNews, latestCount: 0 };
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

  it("rejects a tool without tags", () => {
    const entry = { ...rawTools.entries[0], tags: [] };
    const broken = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a tools section without any tool", () => {
    const broken = { ...rawTools, entries: [] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("accepts a tool without a repository url", () => {
    const entry = { ...rawTools.entries[0], repoUrl: undefined };
    const ok = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(ok).success).toBe(true);
  });

  it.each([
    "http://github.com/nokgc333/pipeinit",
    "https://example.com/nokgc333/pipeinit",
    "https://github.com.example.com/nokgc333/pipeinit",
    "javascript:alert(1)",
    "github.com/nokgc333/pipeinit",
  ])("rejects the repository url %s", (repoUrl) => {
    const entry = { ...rawTools.entries[0], repoUrl };
    const broken = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a repository link label that has no place for the tool name", () => {
    const broken = { ...rawTools, repoLinkLabel: "GitHubリポジトリ" };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a site url that is not a url", () => {
    const broken = { ...rawSite, url: "space-log.vercel.app" };
    expect(siteSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an empty site name", () => {
    expect(siteSchema.safeParse({ ...rawSite, name: "" }).success).toBe(false);
  });
});
