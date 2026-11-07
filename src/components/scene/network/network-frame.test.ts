import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { findQueryNode, pointerToLocal, signalMix } from "./network-frame";

const camera = new PerspectiveCamera(45, 1.5, 0.1, 100);
camera.position.z = 7;
camera.updateMatrixWorld();
const matrix = new Matrix4().multiplyMatrices(
  camera.projectionMatrix,
  camera.matrixWorldInverse,
);
const view = {
  width: 900,
  height: 600,
  worldWidth: 8.7,
  worldHeight: 5.8,
  matrix: matrix.elements,
};
describe("findQueryNode", () => {
  it("matches Three projection when current particles have rotated and drifted", () => {
    const positions = new Float32Array([1.2, 0.7, 1.8, -1, 0, -1]);
    const point = new Vector3(...positions.slice(0, 3))
      .applyAxisAngle(new Vector3(0, 1, 0), 0.8)
      .project(camera);
    expect(findQueryNode(positions, 0.8, point, view)).toBe(0);
    expect(findQueryNode(positions, 0.8, { x: -0.95, y: -0.95 }, view)).toBe(
      -1,
    );
  });
  it("rejects hidden particles when projection places them behind the camera", () => {
    expect(
      findQueryNode(new Float32Array([0, 0, 8]), 0, { x: 0, y: 0 }, view),
    ).toBe(-1);
  });
});

describe("signalMix", () => {
  it("keeps the ends: no activity is plain gray, full activity is full signal", () => {
    expect(signalMix(0)).toBe(0);
    expect(signalMix(1)).toBe(1);
  });

  it("shows more color than a straight blend while activity fades", () => {
    expect(signalMix(0.25)).toBeGreaterThan(0.25);
  });

  it("never goes down as activity goes up", () => {
    expect(signalMix(0.6)).toBeGreaterThan(signalMix(0.3));
  });
});

function turn(x: number, z: number, rotation: number) {
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  return { x: x * c + z * s, z: -x * s + z * c };
}

describe("pointerToLocal", () => {
  it("is the plain pointer position when the cloud has not turned", () => {
    expect(pointerToLocal(1.5, 0.5, 0)).toEqual({ x: 1.5, y: 0.5, z: 0 });
  });

  it("lands back on the pointer once the cloud's own turn is applied, at any angle", () => {
    for (const rotation of [0.4, Math.PI / 2, 2.5, Math.PI, 4.7, 9]) {
      const local = pointerToLocal(1.5, 0.5, rotation);
      const world = turn(local.x, local.z, rotation);
      expect(world.x).toBeCloseTo(1.5, 6);
      expect(world.z).toBeCloseTo(0, 6);
      expect(local.y).toBe(0.5);
    }
  });
});
