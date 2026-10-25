import { z } from "zod";

import { text } from "./common";

export type PrivacyListItem = { text: string; children?: PrivacyListItem[] };

const privacyListItemSchema: z.ZodType<PrivacyListItem> = z.lazy(() =>
  z.object({
    text,
    children: z.array(privacyListItemSchema).min(1).optional(),
  }),
);

const privacyBlockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("paragraph"), text }),
  z.object({
    kind: z.literal("list"),
    style: z.enum(["number", "bullet"]),
    items: z.array(privacyListItemSchema).min(1),
  }),
]);

export const privacySchema = z.object({
  title: text,
  updated: z.iso.date(),
  lead: text,
  sections: z
    .array(
      z.object({
        heading: text,
        blocks: z.array(privacyBlockSchema).min(1),
      }),
    )
    .min(1),
  backLabel: text,
});

export type Privacy = z.infer<typeof privacySchema>;
export type PrivacySection = Privacy["sections"][number];
export type PrivacyBlock = PrivacySection["blocks"][number];
