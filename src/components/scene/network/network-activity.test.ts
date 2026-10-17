import { describe, expect, it } from "vitest";
import {
  createActivityState,
  startPulse,
  stepActivity,
} from "./network-activity";
import { buildNetworkGraph } from "./network-graph";
import { PULSE_HOP_SECONDS } from "./network-settings";
const graph = buildNetworkGraph(
  new Float32Array([0, 0, 0, 0.1, 0, 0, 0.2, 0, 0, 9, 0, 0]),
  0.11,
  2,
);

describe("stepActivity", () => {
  it("relays only one edge per frame when a particle is traced", () => {
    const state = createActivityState(4);
    stepActivity(state, graph, 1 / 60, 0);
    expect(Array.from(state.values)).toEqual([1, 0, 0, 0]);
    stepActivity(state, graph, 1 / 60, -1);
    expect(state.values[1]).toBeGreaterThan(0);
    expect(state.values[2]).toBe(0);
    expect(state.values[3]).toBe(0);
  });
  it("retains a trail then fades it when the pointer leaves", () => {
    const state = createActivityState(4);
    stepActivity(state, graph, 1 / 60, 0);
    for (let i = 0; i < 60; i++) stepActivity(state, graph, 1 / 60, -1);
    expect(state.values[0]).toBeGreaterThan(0.1);
    for (let i = 0; i < 120; i++) stepActivity(state, graph, 1 / 60, -1);
    expect(Math.max(...state.values)).toBeLessThan(0.01);
  });
});
describe("startPulse", () => {
  it("delays each neighbor by BFS arrival when a click starts a ripple", () => {
    const state = createActivityState(4);
    startPulse(state, graph, 0);
    expect(Array.from(state.hops)).toEqual([0, 1, 2, -1]);
    stepActivity(state, graph, PULSE_HOP_SECONDS / 2, -1);
    expect(state.values[0]).toBeGreaterThan(0.9);
    expect(state.values[1]).toBe(0);
    stepActivity(state, graph, PULSE_HOP_SECONDS / 2, -1);
    expect(state.values[1]).toBeGreaterThan(0);
    expect(state.values[2]).toBe(0);
    expect(state.values[3]).toBe(0);
  });
  it("uses half intensity and reuses the queue when an idle ripple replaces a click", () => {
    const state = createActivityState(4),
      queue = state.queue;
    startPulse(state, graph, 0);
    startPulse(state, graph, 2, 0.5);
    stepActivity(state, graph, 1 / 60, -1);
    expect(state.queue).toBe(queue);
    expect(Array.from(state.hops)).toEqual([2, 1, 0, -1]);
    expect(state.values[2]).toBeGreaterThan(0.4);
    expect(state.values[2]).toBeLessThanOrEqual(0.5);
  });
});
