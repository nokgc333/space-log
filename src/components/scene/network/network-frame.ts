import * as S from "./network-settings";

export type NetworkView = {
  width: number;
  height: number;
  worldWidth: number;
  worldHeight: number;
  matrix: ArrayLike<number>;
};

export function findQueryNode(
  positions: Float32Array,
  rotation: number,
  pointer: { x: number; y: number },
  view: NetworkView,
): number {
  const { matrix: m, width, height } = view;
  const { x: px, y: py } = pointer;
  const c = Math.cos(rotation),
    s = Math.sin(rotation);
  let nearest = -1,
    best = S.QUERY_RADIUS_PIXELS ** 2;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] * c + positions[i + 2] * s;
    const y = positions[i + 1];
    const z = -positions[i] * s + positions[i + 2] * c;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (w <= 0) continue;
    const sx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    const sy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    const sz = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    if (Math.abs(sx) > 1 || Math.abs(sy) > 1 || Math.abs(sz) > 1) continue;
    const distance =
      (((sx - px) * width) / 2) ** 2 + (((sy - py) * height) / 2) ** 2;
    if (distance >= best) continue;
    best = distance;
    nearest = i / 3;
  }
  return nearest;
}

export function pointerToLocal(x: number, y: number, rotation: number) {
  return { x: x * Math.cos(rotation), y, z: x * Math.sin(rotation) };
}

export function signalMix(value: number): number {
  return value ** S.SIGNAL_CURVE;
}
