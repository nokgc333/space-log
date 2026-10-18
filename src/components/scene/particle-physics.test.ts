import { describe, expect, it } from "vitest";

import { stepParticles } from "./particle-physics";

function oneParticle(position: [number, number, number]) {
  return {
    positions: Float32Array.from(position),
    origins: Float32Array.from(position),
    velocities: new Float32Array(3),
  };
}

describe("stepParticles", () => {
  it("pushes a particle away from a pointer that is close to it", () => {
    const near = oneParticle([1, 0, 0]);
    const far = oneParticle([1, 0, 0]);
    stepParticles(near, { x: 0.5, y: 0 }, 0);
    stepParticles(far, { x: 9, y: 0 }, 0);
    expect(near.positions[0]).toBeGreaterThan(far.positions[0]);
  });

  it("ignores a pointer that is outside its reach", () => {
    const a = oneParticle([1, 0, 0]);
    const b = oneParticle([1, 0, 0]);
    stepParticles(a, { x: 5, y: 0 }, 0);
    stepParticles(b, { x: 50, y: 50 }, 0);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });

  it("settles back near its origin once the pointer is gone", () => {
    const particle = oneParticle([1, 0, 0]);
    particle.positions[0] = 2;
    for (let frame = 0; frame < 400; frame++) {
      stepParticles(particle, { x: 99, y: 99 }, frame * 0.016);
    }
    expect(Math.abs(particle.positions[0] - 1)).toBeLessThan(0.3);
  });

  it("pushes a particle away from a pointer that is in front of or behind it", () => {
    const withDepth = oneParticle([1, 0, 0]);
    const flat = oneParticle([1, 0, 0]);
    stepParticles(withDepth, { x: 1, y: 0, z: 1 }, 0);
    stepParticles(flat, { x: 1, y: 0 }, 0);
    expect(withDepth.positions[2]).toBeLessThan(flat.positions[2]);
  });

  it("never produces NaN when the pointer sits exactly on a particle", () => {
    const particle = oneParticle([1, 0, 0]);
    stepParticles(particle, { x: 1, y: 0 }, 0);
    expect(Array.from(particle.positions).every(Number.isFinite)).toBe(true);
  });
});
