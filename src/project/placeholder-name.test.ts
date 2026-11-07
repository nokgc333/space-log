// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NAME = "space-log";
const CHECKED_FOLDERS = ["src", "e2e", "content"];
const SOURCE_FILE = /\.(ts|tsx|mts|cjs|mjs|md|css)$/;
const ALLOWED = ["content/site.ts"];

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return SOURCE_FILE.test(entry.name) ? [full] : [];
  });
}

describe("the working name of the site", () => {
  const sources = CHECKED_FOLDERS.flatMap((folder) =>
    files(path.join(ROOT, folder)),
  ).filter((file) => !file.endsWith("placeholder-name.test.ts"));

  it("finds the source folders, so this check cannot pass by looking at nothing", () => {
    expect(sources.length).toBeGreaterThan(100);
  });

  it("is written in one place only, content/site.ts, so renaming the site is a change of that file", () => {
    const mentions = sources
      .filter((file) => fs.readFileSync(file, "utf-8").includes(NAME))
      .map((file) => path.relative(ROOT, file));

    expect(mentions.sort()).toEqual(ALLOWED);
  });
});
