import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadNewsEntries } from "./load-news-entries";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "news-"));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

function write(name: string, text: string) {
  fs.writeFileSync(path.join(dir, name), text);
}

function entryFile(date: string, kind = "added", text = "Something happened") {
  return `---\ndate: "${date}"\nkind: ${kind}\ntext: "${text}"\n---\n`;
}

describe("loadNewsEntries", () => {
  it("reads every entry file and lists the newest first", () => {
    write("2026-01-02-first.md", entryFile("2026-01-02"));
    write("2026-03-01-third.md", entryFile("2026-03-01"));
    write("2025-12-31-zero.md", entryFile("2025-12-31"));
    expect(loadNewsEntries(dir).map((e) => e.date)).toEqual([
      "2026-03-01",
      "2026-01-02",
      "2025-12-31",
    ]);
  });

  it("lists entries of the same day in file name order, whatever order the disk gives", () => {
    write("2026-01-02-b-second.md", entryFile("2026-01-02", "added", "B"));
    write("2026-01-02-a-first.md", entryFile("2026-01-02", "added", "A"));
    vi.spyOn(fs, "readdirSync").mockReturnValue([
      "2026-01-02-b-second.md",
      "2026-01-02-a-first.md",
    ] as never);
    expect(loadNewsEntries(dir).map((e) => e.text)).toEqual(["A", "B"]);
  });

  it("takes the id from the file name", () => {
    write("2026-01-02-first-post.md", entryFile("2026-01-02"));
    expect(loadNewsEntries(dir)[0].id).toBe("2026-01-02-first-post");
  });

  it("keeps only the date, kind and text of an entry, and ignores the body", () => {
    write(
      "2026-01-02-first.md",
      `${entryFile("2026-01-02", "fixed", "Fixed it")}\nLong body text.\n`,
    );
    const [entry] = loadNewsEntries(dir);
    expect(entry).toEqual({
      id: "2026-01-02-first",
      date: "2026-01-02",
      kind: "fixed",
      text: "Fixed it",
    });
  });

  it("accepts a date written without quotes", () => {
    write(
      "2026-01-02-plain.md",
      "---\ndate: 2026-01-02\nkind: added\ntext: Plain date\n---\n",
    );
    expect(loadNewsEntries(dir)[0].date).toBe("2026-01-02");
  });

  it("rejects a markdown file that is not named like an entry", () => {
    write("notes.md", entryFile("2026-01-02"));
    expect(() => loadNewsEntries(dir)).toThrow(/notes\.md/);
  });

  it("rejects a file without frontmatter", () => {
    write("2026-01-02-bare.md", "Just text, no frontmatter.\n");
    expect(() => loadNewsEntries(dir)).toThrow(
      /2026-01-02-bare\.md: no frontmatter/,
    );
  });
});
