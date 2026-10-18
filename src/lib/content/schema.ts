import { z } from "zod";

const text = z.string().min(1);

const isGitHubUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
};

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
  menuLabel: text,
  skipLabel: text,
  themeLabel: text,
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

export const newsSchema = z.object({
  heading: sectionHeadingSchema,
  kindLabels: z.object({ added: text, updated: text, fixed: text }),
  latestCount: z.number().int().positive(),
});

export const newsEntrySchema = z.object({
  date: z.iso.date(),
  kind: z.enum(["added", "updated", "fixed"]),
  text,
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

export const toolsSchema = z.object({
  heading: sectionHeadingSchema,
  columns: z.object({ repo: text, tool: text, tags: text, summary: text }),
  toggleLabels: z.object({ open: text, close: text }),
  repoLinkLabel: text.refine(
    (label) => label.includes("{name}"),
    "the label needs {name} for the tool name",
  ),
  pager: z.object({ prev: text, next: text }),
  entries: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z-]+$/),
        name: text,
        repoUrl: z
          .string()
          .refine(isGitHubUrl, "not an https github.com url")
          .optional(),
        tags: z.array(text).min(1),
        summary: text,
        detail: text,
      }),
    )
    .min(1)
    .refine(hasUniqueIds, "duplicate tool id"),
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
  mail: z.object({
    subject: text,
    labels: z.object({
      name: text,
      email: text,
      company: text,
      topic: text,
      message: text,
    }),
    empty: text,
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
export type NewsEntry = z.infer<typeof newsEntrySchema> & {
  id: string;
};
export type News = z.infer<typeof newsSchema> & { entries: NewsEntry[] };
export type Pipeline = z.infer<typeof pipelineSchema>;
export type PipelineStage = Pipeline["stages"][number];
export type Tools = z.infer<typeof toolsSchema>;
export type Tool = Tools["entries"][number];
export type Contact = z.infer<typeof contactContentSchema>;
export type ContactMessages = Contact["messages"];
export type ContactMail = Contact["mail"];
export type Privacy = z.infer<typeof privacySchema>;
