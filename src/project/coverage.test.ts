// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf-8");
const config = read("vitest.config.mts");
const ci = read(".github/workflows/ci.yml");

describe("coverage gate", () => {
  it.each(["statements", "branches", "functions", "lines"])(
    "fails the run when the %s coverage drops below 95%",
    (metric) => {
      expect(config).toMatch(new RegExp(`${metric}:\\s*95\\b`));
    },
  );

  it("leaves out only the files whose behavior the end-to-end tests check", () => {
    const excluded = [...config.matchAll(/"(src\/app\/[^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(excluded.sort()).toEqual(["src/app/fonts.ts", "src/app/layout.tsx"]);
  });

  it("runs the unit tests with coverage in the CI and keeps the report", () => {
    expect(ci).toContain("npm run test:coverage");
    expect(ci).toMatch(/if: always\(\)\s+with:\s+name: coverage-report/);
  });

  it("does not commit the generated report", () => {
    expect(read(".gitignore")).toContain("/coverage");
  });
});
