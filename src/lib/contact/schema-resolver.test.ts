import { describe, expect, it } from "vitest";
import { z } from "zod";

import { schemaResolver } from "./schema-resolver";

const schema = z.object({
  name: z.string().trim().min(1, "name needed").max(3, "name too long"),
  age: z.number().min(18, "too young"),
  note: z.string().default(""),
});
const resolve = schemaResolver(schema);
const run = (values: unknown) =>
  resolve(values as never, undefined, {} as never);

describe("schemaResolver", () => {
  it("gives the checked values and no errors for a valid entry", async () => {
    expect(await run({ name: " ab ", age: 20 })).toEqual({
      values: { name: "ab", age: 20, note: "" },
      errors: {},
    });
  });

  it("gives no values and one error per wrong field", async () => {
    expect(await run({ name: "", age: 5, note: "" })).toEqual({
      values: {},
      errors: {
        name: { type: "validation", message: "name needed" },
        age: { type: "validation", message: "too young" },
      },
    });
  });

  it("keeps only the first message of a field", async () => {
    const strict = schemaResolver(
      z.object({ name: z.string().min(2, "first").regex(/^\d+$/, "second") }),
    );
    const result = await strict({ name: "" } as never, undefined, {} as never);
    expect(result.errors).toEqual({
      name: { type: "validation", message: "first" },
    });
  });

  it("names a nested field by its dotted path", async () => {
    const nested = schemaResolver(
      z.object({ who: z.object({ mail: z.string().min(1, "mail needed") }) }),
    );
    const result = await nested(
      { who: { mail: "" } } as never,
      undefined,
      {} as never,
    );
    expect(Object.keys(result.errors)).toEqual(["who.mail"]);
  });

  it("ignores a problem that belongs to no field", async () => {
    const refined = schemaResolver(
      z.object({ a: z.string() }).refine(() => false, "whole form"),
    );
    const result = await refined({ a: "x" } as never, undefined, {} as never);
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({});
  });
});
