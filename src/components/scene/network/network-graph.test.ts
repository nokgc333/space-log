import { describe, expect, it } from "vitest";
import { spherePoints } from "../scene-settings";
import { buildNetworkGraph } from "./network-graph";

describe("buildNetworkGraph", () => {
  it("connects nearby particles once when they cross three grid boundaries", () => {
    const graph = buildNetworkGraph(
      new Float32Array([0.19, 0.19, 0.19, 0.21, 0.21, 0.21, 4, 0, 0]),
      0.2,
      3,
    );
    expect(Array.from(graph.edges)).toEqual([0, 1]);
    expect(Array.from(graph.offsets)).toEqual([0, 1, 2, 2]);
    expect(Array.from(graph.neighbors)).toEqual([1, 0]);
  });
  it("bounds degree and distance when the full sphere graph is built", () => {
    const positions = spherePoints(2800, 3);
    const graph = buildNetworkGraph(positions);
    const pairs = new Set<string>();
    expect(graph.edges.length / 2).toBeLessThanOrEqual(4200);
    for (let node = 0; node < 2800; node++)
      expect(graph.offsets[node + 1] - graph.offsets[node]).toBeLessThanOrEqual(
        3,
      );
    for (let edge = 0; edge < graph.edges.length; edge += 2) {
      const a = graph.edges[edge],
        b = graph.edges[edge + 1];
      expect(a).toBeLessThan(b);
      expect(
        Math.hypot(
          ...[0, 1, 2].map(
            (axis) => positions[a * 3 + axis] - positions[b * 3 + axis],
          ),
        ),
      ).toBeLessThanOrEqual(0.55);
      pairs.add(`${a}:${b}`);
    }
    expect(pairs.size).toBe(graph.edges.length / 2);
    expect(graph.edges.length / 2800).toBeGreaterThan(2);
  });
});
