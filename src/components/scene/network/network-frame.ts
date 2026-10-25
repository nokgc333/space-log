import { stepParticles } from "../particle-physics";
import {
  type FrameLoop,
  PARTICLE_COUNT,
  PARTICLE_RADIUS,
  spherePoints,
} from "../scene-settings";
import {
  createActivityState,
  startPulse,
  stepActivity,
} from "./network-activity";
import { buildNetworkGraph } from "./network-graph";
import { LINEAR_PALETTE, lerpRgb } from "./network-palette";
import * as S from "./network-settings";
import type { NetworkInput } from "./use-network-input";

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

export function createNetworkState(isDark: boolean) {
  const origins = spherePoints(PARTICLE_COUNT, PARTICLE_RADIUS);
  const graph = buildNetworkGraph(origins);
  const positions = origins.slice();
  const theme = LINEAR_PALETTE[isDark ? "dark" : "light"];
  const network = {
    buffers: {
      origins,
      positions,
      velocities: new Float32Array(origins.length),
    },
    graph,
    activity: createActivityState(PARTICLE_COUNT),
    nodeColors: new Float32Array(origins.length),
    edgePositions: positions,
    edgeColors: new Float32Array(PARTICLE_COUNT * 4),
    palette: { node: { ...theme.node }, signal: { ...theme.signal } },
    pointer: { x: 1e6, y: 1e6, z: 0 },
    time: 0,
    rotation: 0,
    nextPulse: S.IDLE_PULSE_INTERVAL,
  };
  updateBuffers(network);
  return network;
}
export type NetworkState = ReturnType<typeof createNetworkState>;

export function signalMix(value: number): number {
  return value ** S.SIGNAL_CURVE;
}

function updateBuffers(n: NetworkState): void {
  const { node, signal } = n.palette;
  for (let i = 0; i < n.activity.values.length; i++) {
    const value = signalMix(n.activity.values[i]);
    n.nodeColors[i * 3] = node.r + (signal.r - node.r) * value;
    n.nodeColors[i * 3 + 1] = node.g + (signal.g - node.g) * value;
    n.nodeColors[i * 3 + 2] = node.b + (signal.b - node.b) * value;
    for (let axis = 0; axis < 3; axis++)
      n.edgeColors[i * 4 + axis] = n.nodeColors[i * 3 + axis];
    n.edgeColors[i * 4 + 3] =
      S.EDGE_OPACITY + (S.ACTIVE_EDGE_OPACITY - S.EDGE_OPACITY) * value;
  }
}

export type FrameContext = {
  isDark: boolean;
  frameLoop: FrameLoop;
  view: NetworkView;
  elapsed: number;
};

function blendPalette(
  n: NetworkState,
  { isDark, frameLoop }: FrameContext,
  delta: number,
): void {
  const target = LINEAR_PALETTE[isDark ? "dark" : "light"];
  const ease =
    frameLoop === "demand" ? 1 : 1 - Math.exp(-S.COLOR_RESPONSE * delta);
  lerpRgb(n.palette.node, target.node, ease);
  lerpRgb(n.palette.signal, target.signal, ease);
}

function aimPointer(
  n: NetworkState,
  input: NetworkInput,
  view: NetworkView,
): void {
  if (!input.inside) {
    n.pointer.x = n.pointer.y = 1e6;
    n.pointer.z = 0;
    return;
  }
  const local = pointerToLocal(
    (input.x * view.worldWidth) / 2,
    (input.y * view.worldHeight) / 2,
    n.rotation,
  );
  n.pointer.x = local.x;
  n.pointer.y = local.y;
  n.pointer.z = local.z;
}

function startPulses(
  n: NetworkState,
  input: NetworkInput,
  view: NetworkView,
): void {
  if (input.pendingClick) {
    const click = { x: input.clickX, y: input.clickY };
    const seed = findQueryNode(n.buffers.positions, n.rotation, click, view);
    startPulse(n.activity, n.graph, seed);
  } else if (
    n.time >= n.nextPulse &&
    n.activity.age < 0 &&
    n.graph.edges.length
  ) {
    const seed =
      n.graph.edges[Math.floor(Math.random() * n.graph.edges.length)];
    startPulse(n.activity, n.graph, seed, S.IDLE_PULSE_STRENGTH);
  }
  if (n.activity.age === 0) n.nextPulse = n.time + S.IDLE_PULSE_INTERVAL;
}

function advance(
  n: NetworkState,
  input: NetworkInput,
  view: NetworkView,
  delta: number,
): void {
  n.time += delta;
  n.rotation = n.time * S.ROTATION_SPEED;
  aimPointer(n, input, view);
  stepParticles(n.buffers, n.pointer, n.time);
  const query = input.inside
    ? findQueryNode(n.buffers.positions, n.rotation, input, view)
    : -1;
  startPulses(n, input, view);
  stepActivity(n.activity, n.graph, delta, query);
}

export function stepNetworkFrame(
  n: NetworkState,
  input: NetworkInput,
  frame: FrameContext,
): void {
  const delta = Math.min(Math.max(frame.elapsed, 0), S.MAX_STEP_SECONDS);
  blendPalette(n, frame, delta);
  if (frame.frameLoop === "always" && delta > 0) {
    advance(n, input, frame.view, delta);
  }
  input.pendingClick = false;
  updateBuffers(n);
}
