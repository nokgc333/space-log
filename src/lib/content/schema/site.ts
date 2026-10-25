import { z } from "zod";

import { text } from "./common";

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

export type Site = z.infer<typeof siteSchema>;
