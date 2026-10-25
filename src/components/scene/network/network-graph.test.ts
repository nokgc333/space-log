import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { spherePoints } from "../scene-settings";
import { buildNetworkGraph } from "./network-graph";

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fingerprint(values: ArrayLike<number>) {
  return createHash("sha256")
    .update(Buffer.from(new Uint32Array(values).buffer))
    .digest("hex")
    .slice(0, 16);
}

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
  it.each([
    [2800, 1, 8138, "f00ac17ab0b6fb8f", "08ad09e6d55cebcf", "930d732a6962d816"],
    [500, 7, 1048, "4c77f6d964a45591", "20bc7468d94436e5", "c6f026d460f02787"],
    [64, 3, 14, "6267ac01da0be0b9", "9e9e2a67c83b5c8e", "9f4c40e07d4e24bc"],
  ])(
    "builds exactly the same graph for %i seeded particles (seed %i)",
    (count, seed, length, edges, offsets, neighbors) => {
      const graph = buildNetworkGraph(spherePoints(count, 3, seeded(seed)));

      expect(graph.edges.length).toBe(length);
      expect(fingerprint(graph.edges)).toBe(edges);
      expect(fingerprint(graph.offsets)).toBe(offsets);
      expect(fingerprint(graph.neighbors)).toBe(neighbors);
    },
  );
});
