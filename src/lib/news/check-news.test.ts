import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { checkNewsEntries } from "./check-news";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "news-check-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function write(name: string, text: string) {
  fs.writeFileSync(path.join(dir, name), text);
}

const entry = (date: string, kind = "added", text = "Something happened") =>
  `---\ndate: "${date}"\nkind: ${kind}\ntext: "${text}"\n---\n`;

describe("checkNewsEntries", () => {
  it("reports nothing and counts the entries when every file is right", () => {
    write("2026-01-02-first.md", entry("2026-01-02"));
    write("2026-02-03-second.md", entry("2026-02-03", "fixed"));

    expect(checkNewsEntries(dir)).toEqual({ count: 2, problems: [] });
  });

  it("names a file whose name does not follow the date-and-words pattern", () => {
    write("news.md", entry("2026-01-02"));

    const { problems } = checkNewsEntries(dir);

    expect(problems).toEqual([
      { file: "news.md", message: expect.stringContaining("name it like") },
    ]);
  });

  it("names a file without front matter", () => {
    write("2026-01-02-plain.md", "Just text\n");

    expect(checkNewsEntries(dir).problems[0]).toMatchObject({
      file: "2026-01-02-plain.md",
      message: expect.stringContaining("no frontmatter"),
    });
  });

  it("names a kind that is not added, updated or fixed", () => {
    write("2026-01-02-odd.md", entry("2026-01-02", "removed"));

    expect(checkNewsEntries(dir).problems[0]).toMatchObject({
      file: "2026-01-02-odd.md",
      message: expect.stringContaining("kind"),
    });
  });

  it("names a file whose date differs from the date in its name", () => {
    write("2026-01-02-moved.md", entry("2026-01-09"));

    expect(checkNewsEntries(dir).problems[0].message).toContain(
      "differs from date",
    );
  });

  it("lists every wrong file, not only the first one", () => {
    write("2026-01-02-good.md", entry("2026-01-02"));
    write("bad-name.md", entry("2026-01-03"));
    write("2026-01-04-bad-kind.md", entry("2026-01-04", "nope"));
    write("2026-01-05-bad-date.md", entry("2026-02-05"));

    const result = checkNewsEntries(dir);

    expect(result.count).toBe(4);
    expect(result.problems.map((problem) => problem.file)).toEqual([
      "2026-01-04-bad-kind.md",
      "2026-01-05-bad-date.md",
      "bad-name.md",
    ]);
  });

  it("ignores files that are not Markdown", () => {
    write("notes.txt", "x");

    expect(checkNewsEntries(dir)).toEqual({ count: 0, problems: [] });
  });

  it("reports a folder that does not exist", () => {
    expect(checkNewsEntries(path.join(dir, "missing")).problems[0]).toEqual({
      file: path.join(dir, "missing"),
      message: "news folder not found",
    });
  });
});
