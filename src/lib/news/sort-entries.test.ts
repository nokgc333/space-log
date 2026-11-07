import { describe, expect, it } from "vitest";

import { sortNewestFirst } from "./sort-entries";

const entry = (date: string) => ({
  id: date,
  date,
  kind: "added" as const,
  text: date,
});

describe("sortNewestFirst", () => {
  it("puts the latest date first", () => {
    const sorted = sortNewestFirst([
      entry("2026-01-02"),
      entry("2026-03-01"),
      entry("2025-12-31"),
    ]);
    expect(sorted.map((e) => e.date)).toEqual([
      "2026-03-01",
      "2026-01-02",
      "2025-12-31",
    ]);
  });

  it("does not change the array it was given", () => {
    const entries = [entry("2026-01-02"), entry("2026-03-01")];
    sortNewestFirst(entries);
    expect(entries[0].date).toBe("2026-01-02");
  });

  it("keeps the written order of entries on the same day", () => {
    const first = {
      id: "first",
      date: "2026-05-05",
      kind: "added" as const,
      text: "first",
    };
    const second = {
      id: "second",
      date: "2026-05-05",
      kind: "fixed" as const,
      text: "second",
    };
    expect(sortNewestFirst([first, second]).map((e) => e.text)).toEqual([
      "first",
      "second",
    ]);
  });
});
