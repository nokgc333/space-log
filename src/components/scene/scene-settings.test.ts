import { describe, expect, it } from "vitest";

import {
  clampDpr,
  frameLoopFor,
  MAX_DPR,
  spherePoints,
} from "./scene-settings";

describe("clampDpr", () => {
  it("never renders above the cap on dense screens", () => {
    expect(clampDpr(3)).toBe(MAX_DPR);
  });
  it("keeps a 2x screen at its own resolution, so one-pixel lines stay as fine as the screen allows", () => {
    expect(clampDpr(2)).toBe(2);
  });
  it("keeps ordinary screens as they are", () => {
    expect(clampDpr(1)).toBe(1);
  });
  it("treats broken values as 1", () => {
    expect(clampDpr(0)).toBe(1);
    expect(clampDpr(Number.NaN)).toBe(1);
  });
});

describe("frameLoopFor", () => {
  const visible = {
    isInView: true,
    isDocumentVisible: true,
    prefersReducedMotion: false,
  };

  it("animates only while the scene is on screen and the tab is shown", () => {
    expect(frameLoopFor(visible)).toBe("always");
  });
  it("stops when the scene is scrolled away", () => {
    expect(frameLoopFor({ ...visible, isInView: false })).toBe("demand");
  });
  it("stops when the tab is hidden", () => {
    expect(frameLoopFor({ ...visible, isDocumentVisible: false })).toBe(
      "demand",
    );
  });
  it("stops when the visitor asked for less motion", () => {
    expect(frameLoopFor({ ...visible, prefersReducedMotion: true })).toBe(
      "demand",
    );
  });
});

describe("spherePoints", () => {
  it("returns three coordinates per point", () => {
    expect(spherePoints(10, 3, () => 0.5)).toHaveLength(30);
  });
  it("keeps every point inside the sphere", () => {
    let seed = 1;
    const random = () =>
      ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const points = spherePoints(500, 3, random);
    for (let i = 0; i < points.length; i += 3) {
      const distance = Math.hypot(points[i], points[i + 1], points[i + 2]);
      expect(distance).toBeLessThanOrEqual(3 + 1e-9);
    }
  });
});
