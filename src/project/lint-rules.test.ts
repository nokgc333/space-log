// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const config = fs.readFileSync(
  path.join(process.cwd(), "eslint.config.mjs"),
  "utf-8",
);
const ci = fs.readFileSync(
  path.join(process.cwd(), ".github", "workflows", "ci.yml"),
  "utf-8",
);

describe("complexity rules", () => {
  it.each([
    ["complexity", /complexity:\s*\["error",\s*10\]/],
    [
      "function length",
      /"max-lines-per-function":\s*\[\s*"error",\s*\{\s*max:\s*80/,
    ],
    ["file length", /"max-lines":\s*\["error",\s*200\]/],
    ["nesting depth", /"max-depth":\s*\["error",\s*4\]/],
    ["parameter count", /"max-params":\s*\["error",\s*4\]/],
  ])("limits the %s as an error", (_name, pattern) => {
    expect(config).toMatch(pattern);
  });

  it("applies the limits to the source but not to the tests", () => {
    expect(config).toContain('files: ["src/**/*.{ts,tsx}"]');
    expect(config).toContain('ignores: ["**/*.test.{ts,tsx}"]');
  });

  it("is enforced by the lint step of the CI", () => {
    expect(ci).toContain("npm run lint");
  });
});
