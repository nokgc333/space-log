import { z } from "zod";

import { sectionHeadingSchema, text } from "./common";

export const heroSchema = z.object({
  heading: sectionHeadingSchema,
  sceneLabel: text,
  sceneFallback: text,
});

export type Hero = z.infer<typeof heroSchema>;
