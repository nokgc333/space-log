import { describe, expect, it } from "vitest";

import { visibleLineCount } from "./visible-lines";

describe("visibleLineCount", () => {
  it("shows the first line at once", () => {
    expect(visibleLineCount(5, 0, 300)).toBe(1);
  });

  it("adds one line per interval", () => {
    expect(visibleLineCount(5, 650, 300)).toBe(3);
  });

  it("never shows more lines than there are", () => {
    expect(visibleLineCount(5, 99_999, 300)).toBe(5);
  });

  it("shows everything when the interval is zero (reduced motion)", () => {
    expect(visibleLineCount(5, 0, 0)).toBe(5);
  });
});
