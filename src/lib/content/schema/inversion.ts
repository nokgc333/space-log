import { z } from "zod";

import { sectionHeadingSchema, text } from "./common";

const inversionStatementSchema = z
  .object({
    lead: text.optional(),
    main: text,
    highlight: text.optional(),
    tail: text.optional(),
  })
  .refine(
    (statement) =>
      !statement.highlight || statement.main.includes(statement.highlight),
    "the highlighted phrase must be in the main text",
  );

export const inversionSchema = z.object({
  heading: sectionHeadingSchema,
  body: z.array(inversionStatementSchema).min(1),
});

export type Inversion = z.infer<typeof inversionSchema>;
