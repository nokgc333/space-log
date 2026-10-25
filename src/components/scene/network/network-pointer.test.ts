import { describe, expect, it } from "vitest";

import { normalizePointer } from "./network-pointer";

const rect = { left: 100, top: 50, width: 400, height: 200 };

describe("normalizePointer", () => {
  it("maps the center of the rectangle to 0, 0", () => {
    expect(normalizePointer(rect, 300, 150)).toEqual({ x: 0, y: 0 });
  });

  it("maps the left and right edges to -1 and 1, and the top and bottom to 1 and -1", () => {
    expect(normalizePointer(rect, 100, 50)).toEqual({ x: -1, y: 1 });
    expect(normalizePointer(rect, 500, 250)).toEqual({ x: 1, y: -1 });
  });

  it("goes beyond 1 when the pointer is outside the rectangle", () => {
    expect(normalizePointer(rect, 700, 50)?.x).toBe(2);
  });

  it("gives nothing when the rectangle has no size to measure against", () => {
    expect(normalizePointer({ ...rect, width: 0 }, 300, 150)).toBeNull();
    expect(normalizePointer({ ...rect, height: 0 }, 300, 150)).toBeNull();
  });
});
