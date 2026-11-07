// @vitest-environment node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const TSX = path.join(ROOT, "node_modules", ".bin", "tsx");
const SLOW_MS = 30_000;

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-check-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function run(...args: string[]) {
  return spawnSync(TSX, ["scripts/content-check.ts", ...args], {
    cwd: ROOT,
    encoding: "utf-8",
  });
}

describe("npm run content:check", () => {
  it("is wired to the script in package.json", () => {
    const scripts = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"),
    ).scripts;

    expect(scripts["content:check"]).toBe("tsx scripts/content-check.ts");
  });

  it(
    "passes for the content of the repository and says how much it checked",
    { timeout: SLOW_MS },
    () => {
      const result = run();

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/content:check passed \(\d+ news entries/);
    },
  );

  it("fails and names every wrong news file", { timeout: SLOW_MS }, () => {
    fs.writeFileSync(path.join(dir, "bad-name.md"), "---\n---\n");
    fs.writeFileSync(
      path.join(dir, "2026-01-02-odd-kind.md"),
      '---\ndate: "2026-01-02"\nkind: nope\ntext: "x"\n---\n',
    );

    const result = run(dir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("bad-name.md");
    expect(result.stderr).toContain("2026-01-02-odd-kind.md");
    expect(result.stderr).toMatch(/found 2 problem/);
  });
});
