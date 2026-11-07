import { Color, Matrix4, PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { stepParticles } from "../particle-physics";
import {
  createNetworkState,
  findQueryNode,
  pointerToLocal,
  signalMix,
  stepNetworkFrame,
} from "./network-frame";
import { PALETTE, ROTATION_SPEED } from "./network-settings";

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
const idle = () => ({
  x: 0,
  y: 0,
  inside: false,
  clickX: 0,
  clickY: 0,
  pendingClick: false,
});

const rgbOf = (hex: string) => {
  const { r, g, b } = new Color(hex);
  return { r, g, b };
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
describe("stepNetworkFrame", () => {
  it("starts with the original sphere and palette when a scene is created", () => {
    const n = createNetworkState(true);
    expect(n.buffers.positions.length).toBe(8400);
    expect(n.buffers.positions).toEqual(n.buffers.origins);
    for (let i = 0; i < 8400; i += 3)
      expect(
        Math.hypot(...n.buffers.origins.slice(i, i + 3)),
      ).toBeLessThanOrEqual(3.000001);
    expect(n.palette.node).toEqual(rgbOf(PALETTE.dark.node));
    expect(n.nodeColors[0]).toBeCloseTo(n.palette.node.r);
  });
  it("uses original physics and following endpoints when an idle frame advances", () => {
    const n = createNetworkState(false);
    const expected = {
      positions: n.buffers.positions.slice(),
      origins: n.buffers.origins,
      velocities: n.buffers.velocities.slice(),
    };
    stepParticles(expected, { x: 1e6, y: 1e6 }, 1 / 60);
    stepNetworkFrame(n, idle(), {
      isDark: false,
      frameLoop: "always",
      view,
      elapsed: 1 / 60,
    });
    expect(n.buffers.positions).toEqual(expected.positions);
    expect(n.rotation).toBeCloseTo(n.time * ROTATION_SPEED);
    expect(n.edgePositions).toBe(n.buffers.positions);
    expect(n.edgeColors.length).toBe(2800 * 4);
  });
  it("freezes dynamics and directly recolors when demand mode follows active frames", () => {
    const n = createNetworkState(false),
      input = idle();
    for (let i = 0; i < 240; i++)
      stepNetworkFrame(n, input, {
        isDark: false,
        frameLoop: "always",
        view,
        elapsed: 1 / 60,
      });
    const frozen = () => ({
      buffers: n.buffers,
      time: n.time,
      rotation: n.rotation,
      activity: n.activity,
      nextPulse: n.nextPulse,
    });
    const before = JSON.stringify(frozen());
    input.pendingClick = true;
    stepNetworkFrame(n, input, {
      isDark: true,
      frameLoop: "demand",
      view,
      elapsed: 100,
    });
    expect(JSON.stringify(frozen())).toBe(before);
    expect(n.palette.node).toEqual(rgbOf(PALETTE.dark.node));
    expect(n.palette.signal).toEqual(rgbOf(PALETTE.dark.signal));
    expect(input.pendingClick).toBe(false);
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
