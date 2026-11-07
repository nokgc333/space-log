export const POINTER_INFLUENCE = 2.0;
const PUSH_STRENGTH = 0.08;
const RETURN_SPEED = 0.006;
const DAMPING = 0.8;
const NOISE_SPEED = 0.3;
const NOISE_AMPLITUDE = 0.15;

export type ParticleBuffers = {
  positions: Float32Array;
  origins: Float32Array;
  velocities: Float32Array;
};

export function stepParticles(
  { positions, origins, velocities }: ParticleBuffers,
  pointer: { x: number; y: number; z?: number },
  time: number,
): void {
  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - pointer.x;
    const dy = positions[i + 1] - pointer.y;
    const dz = positions[i + 2] - (pointer.z ?? 0);
    const distance = Math.hypot(dx, dy, dz);
    const isPushed = distance > 0 && distance < POINTER_INFLUENCE;
    const push = isPushed
      ? (1 - distance / POINTER_INFLUENCE) * PUSH_STRENGTH
      : 0;

    for (let axis = 0; axis < 3; axis++) {
      const index = i + axis;
      const wave = axis === 1 ? Math.cos : Math.sin;
      const target =
        origins[index] +
        wave(time * NOISE_SPEED + origins[index] * 2) * NOISE_AMPLITUDE;

      if (isPushed) {
        const offset = axis === 0 ? dx : axis === 1 ? dy : dz;
        velocities[index] += (offset / distance) * push;
      }
      velocities[index] += (target - positions[index]) * RETURN_SPEED;
      velocities[index] *= DAMPING;
      positions[index] += velocities[index];
    }
  }
}
