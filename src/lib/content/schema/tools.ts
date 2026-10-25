import { z } from "zod";

import { hasUniqueIds, sectionHeadingSchema, text } from "./common";

const isGitHubUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
};

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

export type Tools = z.infer<typeof toolsSchema>;
export type Tool = Tools["entries"][number];
