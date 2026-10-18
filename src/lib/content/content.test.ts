import { describe, expect, it } from "vitest";

import { jobLog as rawJobLog } from "@content/sections/job-log";
import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { site as rawSite } from "@content/site";

import {
  contact,
  hero,
  inversion,
  jobLog,
  news,
  pipeline,
  privacy,
  site,
} from "./index";
import { jobLogSchema, newsSchema, pipelineSchema, siteSchema } from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [
      site,
      hero,
      inversion,
      news,
      pipeline,
      jobLog,
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

  it("rejects a job with negative hours", () => {
    const job = { ...rawJobLog.jobs[0], hours: -1 };
    const broken = { ...rawJobLog, jobs: [job] };
    expect(jobLogSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a site url that is not a url", () => {
    const broken = { ...rawSite, url: "space-log.vercel.app" };
    expect(siteSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an empty site name", () => {
    expect(siteSchema.safeParse({ ...rawSite, name: "" }).success).toBe(false);
  });
});
