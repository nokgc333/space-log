import { describe, expect, it } from "vitest";

import { getNews } from "./index";

describe("getNews", () => {
  it("returns the section text together with at most the latest entries", () => {
    const news = getNews();
    expect(news.heading.title).not.toBe("");
    expect(news.entries.length).toBeLessThanOrEqual(news.latestCount);
  });

  it("lists the newest entry first", () => {
    const dates = getNews().entries.map((entry) => entry.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
