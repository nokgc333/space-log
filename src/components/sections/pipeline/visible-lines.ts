export function visibleLineCount(
  total: number,
  elapsedMs: number,
  msPerLine: number,
): number {
  if (msPerLine <= 0) return total;
  return Math.min(total, 1 + Math.floor(elapsedMs / msPerLine));
}
