// @vitest-environment node
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { describe, it, expect } from "vitest";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf-8");
const config = createRequire(import.meta.url)(
  path.join(process.cwd(), ".lighthouserc.cjs"),
).ci;

type Matrix = {
  matchingUrlPattern: string;
  aggregationMethod: string;
  assertions: Record<string, [string, Record<string, number>]>;
}[];
const matrix: Matrix = config.assert.assertMatrix;
const home = matrix.find((m) => m.matchingUrlPattern.endsWith("/$"));
const others = matrix.find((m) => m.matchingUrlPattern.endsWith("/.+"));
const everywhere = matrix.find((m) => m.matchingUrlPattern === ".*");

const routes = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routes(full);
    return entry.name === "page.tsx" ? [path.dirname(full)] : [];
  });

describe("Lighthouse CI budgets", () => {
  it("measures every page route of the app, three times each", () => {
    const appDir = path.join(process.cwd(), "src", "app");
    const expected = routes(appDir)
      .map((dir) => path.relative(appDir, dir))
      .map((rel) => (rel === "" ? "/" : `/${rel}`))
      .sort();
    const measured = (config.collect.url as string[])
      .map((url) => new URL(url).pathname)
      .sort();

    expect(measured).toEqual(expected);
    expect(config.collect.numberOfRuns).toBeGreaterThanOrEqual(3);
  });

  it("fails the build (error level) when any budget is exceeded", () => {
    for (const { assertions } of matrix) {
      for (const [name, [level]] of Object.entries(assertions)) {
        expect(level, name).toBe("error");
      }
    }
  });

  it("budgets performance score, LCP, script size and total size for the home page and the other pages", () => {
    for (const group of [home, others]) {
      expect(Object.keys(group!.assertions).sort()).toEqual([
        "categories:performance",
        "largest-contentful-paint",
        "resource-summary:script:size",
        "resource-summary:total:size",
      ]);
    }
  });

  it("budgets layout shift and blocking time on every page", () => {
    expect(everywhere!.assertions["cumulative-layout-shift"][1]).toEqual({
      maxNumericValue: 0.1,
    });
    expect(
      everywhere!.assertions["total-blocking-time"][1].maxNumericValue,
    ).toBeLessThanOrEqual(450);
  });

  it("uses the median run so that one slow run does not fail the build", () => {
    for (const group of matrix) {
      expect(group.aggregationMethod, group.matchingUrlPattern).toBe(
        "median-run",
      );
    }
  });
});

describe("Performance Budget CI job", () => {
  const ci = read(".github/workflows/ci.yml");

  it("builds the app and runs the budgets in a job named Performance Budget", () => {
    expect(ci).toContain("name: Performance Budget");
    expect(ci).toContain("npm run test:perf");
  });

  it("keeps the Lighthouse reports as an artifact even when the budget fails", () => {
    expect(ci).toMatch(/if: always\(\)\s+with:\s+name: lighthouse-report/);
  });

  it("is a required check of the main branch", () => {
    const required = JSON.parse(read(".github/branch-protection/main.json"))
      .required_status_checks.contexts as string[];

    expect(required).toContain("Performance Budget");
  });

  it("does not commit the generated reports", () => {
    expect(read(".gitignore")).toContain("/.lighthouseci/");
    expect(read(".prettierignore")).toContain(".lighthouseci");
    expect(read(".secretlintignore")).toContain(".lighthouseci");
  });
});
