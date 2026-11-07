import { z } from "zod";

export const text = z.string().min(1);

export const hasUniqueIds = (items: { id: string }[]) =>
  new Set(items.map((item) => item.id)).size === items.length;

export const sectionHeadingSchema = z.object({
  label: text,
  title: text,
  subtitle: text,
  lead: text.optional(),
});

export type SectionHeadingContent = z.infer<typeof sectionHeadingSchema>;
