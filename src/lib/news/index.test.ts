import { describe, expect, it, vi } from "vitest";

import type { NewsEntry } from "@/lib/content";

import { getNews } from "./index";

const MANY = 7;

vi.mock("./load-news-entries", () => ({
  loadNewsEntries: (): NewsEntry[] =>
    Array.from({ length: MANY }, (_, index) => ({
      id: `2026-03-0${MANY - index}-item`,
      date: `2026-03-0${MANY - index}`,
      kind: "added" as const,
      text: `Item ${index + 1}`,
    })),
}));

describe("getNews", () => {
  it("returns the section text together with the entries", () => {
    const news = getNews();
    expect(news.heading.title).not.toBe("");
    expect(news.pager.next).not.toBe("");
  });

  it("returns every entry, so the section can page through them", () => {
    expect(getNews().entries).toHaveLength(MANY);
  });

  it("keeps the order the loader gives (newest first)", () => {
    const dates = getNews().entries.map((entry) => entry.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
