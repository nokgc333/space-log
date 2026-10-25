import * as S from "./network-settings";

export type Rgb = { r: number; g: number; b: number };

const HEX_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const LINEAR_CUTOFF = 0.04045;

function toLinear(channel: number): number {
  return channel < LINEAR_CUTOFF
    ? channel * 0.0773993808
    : (channel * 0.9478672986 + 0.0521327014) ** 2.4;
}

export function linearRgbFromHex(hex: string): Rgb {
  const match = HEX_PATTERN.exec(hex);
  if (!match) throw new Error(`Not a #rrggbb color: ${hex}`);
  const [r, g, b] = match
    .slice(1)
    .map((pair) => toLinear(Number.parseInt(pair, 16) / 255));
  return { r, g, b };
}

export function lerpRgb(color: Rgb, target: Rgb, alpha: number): void {
  color.r += (target.r - color.r) * alpha;
  color.g += (target.g - color.g) * alpha;
  color.b += (target.b - color.b) * alpha;
}

const linearTheme = (theme: (typeof S.PALETTE)[keyof typeof S.PALETTE]) => ({
  node: linearRgbFromHex(theme.node),
  signal: linearRgbFromHex(theme.signal),
});

export const LINEAR_PALETTE = {
  light: linearTheme(S.PALETTE.light),
  dark: linearTheme(S.PALETTE.dark),
};
