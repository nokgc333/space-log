import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type * as z from "zod/mini";

export function schemaResolver<Schema extends z.ZodMiniType<FieldValues>>(
  schema: Schema,
): Resolver<z.infer<Schema>> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const name = issue.path.join(".");
      if (name && !(name in errors)) {
        errors[name] = { type: "validation", message: issue.message };
      }
    }
    return { values: {}, errors: errors as FieldErrors<z.infer<Schema>> };
  };
}
