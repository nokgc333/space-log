import * as S from "./network-settings";

export function buildNetworkGraph(
  positions: Float32Array,
  radius = S.LOCAL_EDGE_RADIUS,
  maxNeighbors = S.LOCAL_NEIGHBORS,
) {
  const count = positions.length / 3;
  const grid = new Map<string, number[]>();
  const cell = (node: number, axis: number) =>
    Math.floor(positions[node * 3 + axis] / radius);
  const key = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  for (let node = 0; node < count; node++) {
    const id = key(cell(node, 0), cell(node, 1), cell(node, 2));
    const bucket = grid.get(id);
    if (bucket) bucket.push(node);
    else grid.set(id, [node]);
  }
  const links: number[][] = Array.from({ length: count }, () => []);
  const pairs: number[] = [];
  for (let node = 0; node < count; node++) {
    const candidates: { other: number; distance: number }[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(
            key(cell(node, 0) + dx, cell(node, 1) + dy, cell(node, 2) + dz),
          );
          if (!bucket) continue;
          for (const other of bucket) {
            if (
              other === node ||
              links[other].length >= maxNeighbors ||
              links[node].includes(other)
            )
              continue;
            const distance =
              (positions[node * 3] - positions[other * 3]) ** 2 +
              (positions[node * 3 + 1] - positions[other * 3 + 1]) ** 2 +
              (positions[node * 3 + 2] - positions[other * 3 + 2]) ** 2;
            if (distance <= radius * radius)
              candidates.push({ other, distance });
          }
        }
      }
    }
    candidates.sort((a, b) => a.distance - b.distance || a.other - b.other);
    for (const { other } of candidates) {
      if (links[node].length >= maxNeighbors) break;
      links[node].push(other);
      links[other].push(node);
      pairs.push(Math.min(node, other), Math.max(node, other));
    }
  }
  const offsets = new Uint32Array(count + 1);
  for (let node = 0; node < count; node++)
    offsets[node + 1] = offsets[node] + links[node].length;
  return {
    edges: new Uint32Array(pairs),
    offsets,
    neighbors: new Uint32Array(links.flat()),
  };
}
export type NetworkGraph = ReturnType<typeof buildNetworkGraph>;
