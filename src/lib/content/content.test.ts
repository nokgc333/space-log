import { describe, expect, it } from "vitest";

import { changelog as rawChangelog } from "@content/sections/changelog";
import { jobLog as rawJobLog } from "@content/sections/job-log";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { site as rawSite } from "@content/site";

import {
  changelog,
  contact,
  hero,
  inversion,
  jobLog,
  pipeline,
  privacy,
  site,
} from "./index";
import {
  changelogSchema,
  jobLogSchema,
  pipelineSchema,
  siteSchema,
} from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [
      site,
      hero,
      inversion,
      changelog,
      pipeline,
      jobLog,
      contact,
      privacy,
    ];
    for (const section of sections) expect(section).toBeDefined();
  });

  it("rejects a date that does not exist", () => {
    const broken = {
      ...rawChangelog,
      entries: [{ date: "2026-02-30", kind: "added", text: "x" }],
    };
    expect(changelogSchema.safeParse(broken).success).toBe(false);
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
