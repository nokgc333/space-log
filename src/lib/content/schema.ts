import { z } from "zod";

const text = z.string().min(1);

const hasUniqueIds = (items: { id: string }[]) =>
  new Set(items.map((item) => item.id)).size === items.length;

export const sectionHeadingSchema = z.object({
  label: text,
  title: text,
  subtitle: text,
  lead: text.optional(),
});

export const siteSchema = z.object({
  name: text,
  description: text,
  url: z.url(),
  nav: z
    .array(z.object({ label: text, href: z.string().startsWith("#") }))
    .min(1),
  themeLabels: z.object({ toLight: text, toDark: text }),
  contactShortcut: text,
  footer: z.object({
    copyrightStartYear: z.number().int(),
    privacyLabel: text,
    note: text,
  }),
});

export const heroSchema = z.object({
  heading: sectionHeadingSchema,
  sceneLabel: text,
  sceneFallback: text,
});

export const inversionSchema = z.object({
  heading: sectionHeadingSchema,
  body: z.array(text).min(1),
});

export const changelogSchema = z.object({
  heading: sectionHeadingSchema,
  kindLabels: z.object({ added: text, changed: text, fixed: text }),
  entries: z
    .array(
      z.object({
        date: z.iso.date(),
        kind: z.enum(["added", "changed", "fixed"]),
        text,
      }),
    )
    .min(1),
});

export const pipelineSchema = z.object({
  heading: sectionHeadingSchema,
  replayLabel: text,
  stages: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z-]+$/),
        stage: text,
        tool: text,
        role: text,
        detail: text,
        terminal: z.array(z.string()).min(1),
      }),
    )
    .min(2)
    .refine(hasUniqueIds, "duplicate stage id"),
});

export const jobLogSchema = z.object({
  heading: sectionHeadingSchema,
  columns: z.object({
    id: text,
    title: text,
    status: text,
    hours: text,
    result: text,
  }),
  statusLabels: z.object({ done: text, running: text }),
  toggleLabels: z.object({ open: text, close: text }),
  toolsLabel: text,
  jobs: z
    .array(
      z.object({
        id: z.string().regex(/^JOB-\d{4}$/),
        title: text,
        client: text,
        status: z.enum(["done", "running"]),
        hours: z.number().nonnegative(),
        tools: z.array(text).min(1),
        result: text,
        detail: text,
      }),
    )
    .min(1)
    .refine(hasUniqueIds, "duplicate job id"),
});

export const contactContentSchema = z.object({
  heading: sectionHeadingSchema,
  fields: z.object({
    name: text,
    email: text,
    company: text,
    topic: text,
    message: text,
    consent: text,
  }),
  optionalMark: text,
  topics: z.array(z.object({ value: text, label: text })).min(1),
  submit: text,
  sending: text,
  results: z.object({
    sent: text,
    demo: text,
    rateLimited: text,
    failed: text,
  }),
  messages: z.object({
    required: text,
    tooLong: text,
    email: text,
    singleLine: text,
    choose: text,
    consent: text,
  }),
});

export const privacySchema = z.object({
  title: text,
  updated: z.iso.date(),
  sections: z
    .array(z.object({ heading: text, body: z.array(text).min(1) }))
    .min(1),
  backLabel: text,
});

export type SectionHeadingContent = z.infer<typeof sectionHeadingSchema>;
export type Site = z.infer<typeof siteSchema>;
export type Hero = z.infer<typeof heroSchema>;
export type Inversion = z.infer<typeof inversionSchema>;
export type Changelog = z.infer<typeof changelogSchema>;
export type ChangelogEntry = Changelog["entries"][number];
export type Pipeline = z.infer<typeof pipelineSchema>;
export type PipelineStage = Pipeline["stages"][number];
export type JobLog = z.infer<typeof jobLogSchema>;
export type Job = JobLog["jobs"][number];
export type Contact = z.infer<typeof contactContentSchema>;
export type ContactMessages = Contact["messages"];
export type Privacy = z.infer<typeof privacySchema>;
