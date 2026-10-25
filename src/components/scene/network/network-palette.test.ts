import { describe, expect, it } from "vitest";

import { LINEAR_PALETTE, lerpRgb, linearRgbFromHex } from "./network-palette";

const PRECISION = 6;

describe("linearRgbFromHex", () => {
  it("turns an sRGB hex color into the linear values the graphics card blends in", () => {
    const gray = linearRgbFromHex("#606060");

    expect(gray.r).toBeCloseTo(0.116971, PRECISION);
    expect(gray.g).toBeCloseTo(0.116971, PRECISION);
    expect(gray.b).toBeCloseTo(0.116971, PRECISION);
  });

  it("keeps black at 0 and white at 1", () => {
    expect(linearRgbFromHex("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(linearRgbFromHex("#ffffff")).toEqual({ r: 1, g: 1, b: 1 });
  });

  it("reads the three channels separately", () => {
    const color = linearRgbFromHex("#ff0000");

    expect(color).toEqual({ r: 1, g: 0, b: 0 });
  });

  it("uses the straight-line part of the curve for very dark channels", () => {
    const dark = linearRgbFromHex("#050505");

    expect(dark.r).toBeCloseTo(5 / 255 / 12.92, PRECISION);
  });
});

describe("lerpRgb", () => {
  it("moves the color part of the way to the target, in place", () => {
    const color = { r: 0, g: 0.5, b: 1 };

    lerpRgb(color, { r: 1, g: 0.5, b: 0 }, 0.25);

    expect(color).toEqual({ r: 0.25, g: 0.5, b: 0.75 });
  });

  it("stays where it is for 0 and lands on the target for 1", () => {
    const color = { r: 0.2, g: 0.4, b: 0.6 };

    lerpRgb(color, { r: 1, g: 1, b: 1 }, 0);
    expect(color).toEqual({ r: 0.2, g: 0.4, b: 0.6 });

    lerpRgb(color, { r: 1, g: 1, b: 1 }, 1);
    expect(color).toEqual({ r: 1, g: 1, b: 1 });
  });
});

describe("LINEAR_PALETTE", () => {
  it("holds the node and signal colors of both themes as linear values", () => {
    expect(LINEAR_PALETTE.light.node.r).toBeCloseTo(0.116971, PRECISION);
    expect(LINEAR_PALETTE.dark.node.r).toBeCloseTo(0.658375, PRECISION);
    expect(LINEAR_PALETTE.dark.node.b).toBeCloseTo(0.686685, PRECISION);
    expect(LINEAR_PALETTE.light.signal.r).toBeGreaterThan(
      LINEAR_PALETTE.light.signal.b,
    );
  });
});
