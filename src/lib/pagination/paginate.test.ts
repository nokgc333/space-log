import { describe, expect, it } from "vitest";

import { clampPage, pageCount, paginate } from "./paginate";

const numbers = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1);

describe("pageCount", () => {
  it("is zero when there is nothing to show", () => {
    expect(pageCount(0, 5)).toBe(0);
  });

  it("is one when every item fits on a single page", () => {
    expect(pageCount(1, 5)).toBe(1);
    expect(pageCount(5, 5)).toBe(1);
  });

  it("adds a page as soon as one item overflows", () => {
    expect(pageCount(6, 5)).toBe(2);
    expect(pageCount(10, 5)).toBe(2);
    expect(pageCount(11, 5)).toBe(3);
  });

  it("rejects a page size that is not a positive whole number", () => {
    expect(() => pageCount(5, 0)).toThrow(RangeError);
    expect(() => pageCount(5, -1)).toThrow(RangeError);
    expect(() => pageCount(5, 2.5)).toThrow(RangeError);
  });
});

describe("clampPage", () => {
  it("keeps a page that exists", () => {
    expect(clampPage(0, 3)).toBe(0);
    expect(clampPage(2, 3)).toBe(2);
  });

  it("pulls a page past the end back to the last page", () => {
    expect(clampPage(3, 3)).toBe(2);
    expect(clampPage(99, 3)).toBe(2);
  });

  it("pulls a negative page up to the first page", () => {
    expect(clampPage(-1, 3)).toBe(0);
  });

  it("stays on the first page when there are no pages", () => {
    expect(clampPage(4, 0)).toBe(0);
  });
});

describe("paginate", () => {
  it("returns the first page when asked for page zero", () => {
    expect(paginate(numbers(12), 0, 5).items).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns only the items left over on the last page", () => {
    expect(paginate(numbers(12), 2, 5).items).toEqual([11, 12]);
  });

  it("reports how many pages there are", () => {
    expect(paginate(numbers(12), 0, 5).pageCount).toBe(3);
  });

  it("falls back to the last page when the page is past the end", () => {
    expect(paginate(numbers(12), 9, 5).items).toEqual([11, 12]);
  });

  it("falls back to the first page when the page is negative", () => {
    expect(paginate(numbers(12), -3, 5).items).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns an empty page for an empty list", () => {
    expect(paginate([], 0, 5)).toEqual({
      items: [],
      pageCount: 0,
      fillerCount: 0,
    });
  });

  it("needs no filler when everything fits on one page", () => {
    expect(paginate(numbers(3), 0, 5).fillerCount).toBe(0);
  });

  it("needs no filler on a full page", () => {
    expect(paginate(numbers(10), 1, 5).fillerCount).toBe(0);
  });

  it("fills the missing places of the last page when there are several pages", () => {
    expect(paginate(numbers(6), 1, 5).fillerCount).toBe(4);
    expect(paginate(numbers(12), 2, 5).fillerCount).toBe(3);
  });

  it("does not change the list it is given", () => {
    const list = numbers(7);
    paginate(list, 1, 5);
    expect(list).toEqual(numbers(7));
  });
});
