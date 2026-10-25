import { describe, expect, it, vi } from "vitest";

import { news } from "@/lib/content";

vi.mock("./load-news-entries", () => ({
  loadNewsEntries: () => [
    { id: "2026-01-01-a", date: "2026-01-01", kind: "added", text: "A" },
  ],
}));

import { getNews } from "./index";

describe("getNews", () => {
  it("combines the section texts with the entries read from the files", () => {
    const result = getNews();

    expect(result.heading).toEqual(news.heading);
    expect(result.entries).toEqual([
      { id: "2026-01-01-a", date: "2026-01-01", kind: "added", text: "A" },
    ]);
  });
});
