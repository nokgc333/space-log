import { z } from "zod";

import { hasUniqueIds, sectionHeadingSchema, text } from "./common";

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

export type Pipeline = z.infer<typeof pipelineSchema>;
export type PipelineStage = Pipeline["stages"][number];
