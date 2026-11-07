export type Rect = { left: number; top: number; width: number; height: number };

export function normalizePointer(
  { left, top, width, height }: Rect,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (!width || !height) return null;
  return {
    x: ((clientX - left) / width) * 2 - 1,
    y: 1 - ((clientY - top) / height) * 2,
  };
}
