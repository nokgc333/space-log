export const MAX_DPR = 2;
export const PARTICLE_COUNT = 2800;
export const PARTICLE_RADIUS = 3;

export type FrameLoop = "always" | "demand";

type SceneState = {
  isInView: boolean;
  isDocumentVisible: boolean;
  prefersReducedMotion: boolean;
};

export function clampDpr(deviceRatio: number): number {
  if (!Number.isFinite(deviceRatio) || deviceRatio < 1) return 1;
  return Math.min(deviceRatio, MAX_DPR);
}

export function frameLoopFor({
  isInView,
  isDocumentVisible,
  prefersReducedMotion,
}: SceneState): FrameLoop {
  return isInView && isDocumentVisible && !prefersReducedMotion
    ? "always"
    : "demand";
}

export function spherePoints(
  count: number,
  radius: number,
  random: () => number = Math.random,
): Float32Array {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = radius * Math.cbrt(random());
    points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    points[i * 3 + 2] = r * Math.cos(phi);
  }
  return points;
}
