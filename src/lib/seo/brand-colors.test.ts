// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { BRAND_COLORS } from "./brand-colors";

const css = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "globals.css"),
  "utf-8",
);

function tokensOf(selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*{([^}]*)}`).exec(css)?.[1] ?? "";
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

describe("BRAND_COLORS", () => {
  it("matches the light surface of the site, which the browser bar takes on", () => {
    expect(BRAND_COLORS.light.surface).toBe(tokensOf(":root").surface);
  });

  it("matches the dark surface, text and signal colors of the site", () => {
    const dark = tokensOf("\\.dark");

    expect(BRAND_COLORS.dark).toEqual({
      surface: dark.surface,
      ink: dark.ink,
      signal: dark.signal,
    });
  });
});
