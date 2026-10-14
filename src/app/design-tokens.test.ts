import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "globals.css"), "utf8");
const fonts = readFileSync(resolve(import.meta.dirname, "fonts.ts"), "utf8");

describe("globals.css", () => {
  it.each(["surface", "ink", "muted", "rule", "control", "signal"])(
    "defines --%s for both themes",
    (name) => {
      expect(css.match(new RegExp(`--${name}:`, "g"))).toHaveLength(2);
    },
  );

  it("uses every font variable declared in fonts.ts", () => {
    const names = [...fonts.matchAll(/variable: "(--[\w-]+)"/g)].map(
      (m) => m[1],
    );
    expect(names).toHaveLength(3);
    for (const name of names) expect(css).toContain(`var(${name})`);
  });
});
