import { z } from "zod";

import { sectionHeadingSchema, text } from "./common";

export const newsSchema = z.object({
  heading: sectionHeadingSchema,
  kindLabels: z.object({ added: text, updated: text, fixed: text }),
  perPage: z.number().int().positive(),
  pager: z.object({ prev: text, next: text }),
});

export const newsEntrySchema = z.object({
  date: z.iso.date(),
  kind: z.enum(["added", "updated", "fixed"]),
  text,
});

export type NewsEntry = z.infer<typeof newsEntrySchema> & {
  id: string;
};
export type News = z.infer<typeof newsSchema> & { entries: NewsEntry[] };
