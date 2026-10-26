// @vitest-environment node
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const dir = path.join(process.cwd(), "docs", "adr");
const files = fs
  .readdirSync(dir)
  .filter((file) => file.endsWith(".md"))
  .sort();
const read = (file: string) => fs.readFileSync(path.join(dir, file), "utf-8");

describe("design records", () => {
  it("has at least five records, numbered in order from 0001", () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
    files.forEach((file, index) => {
      expect(file).toMatch(
        new RegExp(`^${String(index + 1).padStart(4, "0")}-[a-z0-9-]+\\.md$`),
      );
    });
  });

  it.each(files)("%s has a title, a status and the four sections", (file) => {
    const text = read(file);

    expect(text).toMatch(/^# ADR-\d{4}: .+/);
    expect(text).toMatch(/^- Status: .+/m);
    for (const heading of [
      "Context",
      "Decision",
      "Consequences",
      "Alternatives considered",
    ]) {
      expect(text, heading).toMatch(new RegExp(`^## ${heading}$`, "m"));
    }
  });

  it("is linked from the README", () => {
    const readme = fs.readFileSync(
      path.join(process.cwd(), "README.md"),
      "utf-8",
    );

    for (const file of files) expect(readme, file).toContain(file);
  });
});
