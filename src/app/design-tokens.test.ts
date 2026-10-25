import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "globals.css"), "utf8");
const fonts = readFileSync(resolve(import.meta.dirname, "fonts.ts"), "utf8");

const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) =>
    channel(parseInt(hex.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe("globals.css", () => {
  const blockOf = (selector: string) =>
    css.match(new RegExp(`^${selector}\\s*\\{([^}]*)\\}`, "m"))?.[1] ?? "";

  it.each(["surface", "ink", "muted", "rule", "control", "signal", "link"])(
    "defines --%s for both themes",
    (name) => {
      expect(blockOf(":root")).toMatch(new RegExp(`--${name}:`));
      expect(blockOf("\\.dark")).toMatch(new RegExp(`--${name}:`));
    },
  );

  it("uses every font variable declared in fonts.ts", () => {
    const names = [...fonts.matchAll(/variable: "(--[\w-]+)"/g)].map(
      (m) => m[1],
    );
    expect(names).toHaveLength(3);
    for (const name of names) expect(css).toContain(`var(${name})`);
  });

  describe("link color", () => {
    const valueIn = (block: string, name: string) => {
      const section =
        css.match(new RegExp(`${block}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
      return (
        section.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? ""
      );
    };

    it.each([
      ["light", ":root"],
      ["dark", "\\.dark"],
    ])(
      "reads at least 4.5:1 on the surface in the %s theme",
      (_theme, block) => {
        const link = valueIn(block, "link");
        const surface = valueIn(block, "surface");
        expect(link).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ratio(link, surface)).toBeGreaterThanOrEqual(4.5);
      },
    );

    it("is a blue in both themes, not a gray", () => {
      for (const block of [":root", "\\.dark"]) {
        const hex = valueIn(block, "link");
        const [r, g, b] = [1, 3, 5].map((i) =>
          parseInt(hex.slice(i, i + 2), 16),
        );
        expect(b).toBeGreaterThan(r + 40);
        expect(b).toBeGreaterThan(g);
      }
    });

    it("is exposed to Tailwind as the text-link color", () => {
      expect(css).toContain("--color-link: var(--link)");
    });
  });

  describe("when the visitor asks for more contrast", () => {
    const more =
      css.match(/@media \(prefers-contrast: more\)\s*\{([\s\S]*?)\n\}/)?.[1] ??
      "";
    const tokenIn = (block: string, name: string) =>
      block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? "";
    const rootMore = more.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
    const darkMore = more.match(/\.dark\s*\{([^}]*)\}/)?.[1] ?? "";

    it.each([
      ["light", rootMore, ":root"],
      ["dark", darkMore, "\\.dark"],
    ])(
      "darkens the quiet text and the borders in the %s theme",
      (_theme, block, base) => {
        const surface = tokenIn(blockOf(base), "surface");

        expect(ratio(tokenIn(block, "muted"), surface)).toBeGreaterThanOrEqual(
          7,
        );
        expect(
          ratio(tokenIn(block, "control"), surface),
        ).toBeGreaterThanOrEqual(4.5);
        expect(ratio(tokenIn(block, "rule"), surface)).toBeGreaterThanOrEqual(
          3,
        );
      },
    );
  });
});
