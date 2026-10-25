import * as S from "./network-settings";

type Cell = readonly [number, number, number];
type Candidate = { other: number; distance: number };
type Neighborhood = {
  positions: Float32Array;
  grid: Map<string, number[]>;
  links: number[][];
  radius: number;
  maxNeighbors: number;
};

const CELL_OFFSETS: Cell[] = [-1, 0, 1].flatMap((dx) =>
  [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dz): Cell => [dx, dy, dz])),
);

const keyOf = ([x, y, z]: Cell) => `${x}:${y}:${z}`;

function cellOf(positions: Float32Array, node: number, radius: number): Cell {
  return [
    Math.floor(positions[node * 3] / radius),
    Math.floor(positions[node * 3 + 1] / radius),
    Math.floor(positions[node * 3 + 2] / radius),
  ];
}

function distanceSquared(positions: Float32Array, a: number, b: number) {
  return (
    (positions[a * 3] - positions[b * 3]) ** 2 +
    (positions[a * 3 + 1] - positions[b * 3 + 1]) ** 2 +
    (positions[a * 3 + 2] - positions[b * 3 + 2]) ** 2
  );
}

function buildGrid(positions: Float32Array, count: number, radius: number) {
  const grid = new Map<string, number[]>();
  for (let node = 0; node < count; node++) {
    const id = keyOf(cellOf(positions, node, radius));
    const bucket = grid.get(id);
    if (bucket) bucket.push(node);
    else grid.set(id, [node]);
  }
  return grid;
}

function nodesAround(grid: Map<string, number[]>, [x, y, z]: Cell) {
  return CELL_OFFSETS.flatMap(
    ([dx, dy, dz]) => grid.get(keyOf([x + dx, y + dy, z + dz])) ?? [],
  );
}

function isLinkable(node: number, other: number, hood: Neighborhood) {
  return (
    other !== node &&
    hood.links[other].length < hood.maxNeighbors &&
    !hood.links[node].includes(other)
  );
}

function candidatesFor(node: number, hood: Neighborhood): Candidate[] {
  const { positions, grid, radius } = hood;
  const candidates: Candidate[] = [];
  for (const other of nodesAround(grid, cellOf(positions, node, radius))) {
    if (!isLinkable(node, other, hood)) continue;
    const distance = distanceSquared(positions, node, other);
    if (distance <= radius * radius) candidates.push({ other, distance });
  }
  return candidates.sort(
    (a, b) => a.distance - b.distance || a.other - b.other,
  );
}

function linkNearest(
  node: number,
  candidates: Candidate[],
  hood: Neighborhood,
  pairs: number[],
) {
  const { links, maxNeighbors } = hood;
  for (const { other } of candidates) {
    if (links[node].length >= maxNeighbors) break;
    links[node].push(other);
    links[other].push(node);
    pairs.push(Math.min(node, other), Math.max(node, other));
  }
}

function toOffsets(links: number[][]) {
  const offsets = new Uint32Array(links.length + 1);
  for (let node = 0; node < links.length; node++)
    offsets[node + 1] = offsets[node] + links[node].length;
  return offsets;
}

export function buildNetworkGraph(
  positions: Float32Array,
  radius = S.LOCAL_EDGE_RADIUS,
  maxNeighbors = S.LOCAL_NEIGHBORS,
) {
  const count = positions.length / 3;
  const hood: Neighborhood = {
    positions,
    grid: buildGrid(positions, count, radius),
    links: Array.from({ length: count }, () => []),
    radius,
    maxNeighbors,
  };
  const pairs: number[] = [];
  for (let node = 0; node < count; node++)
    linkNearest(node, candidatesFor(node, hood), hood, pairs);
  return {
    edges: new Uint32Array(pairs),
    offsets: toOffsets(hood.links),
    neighbors: new Uint32Array(hood.links.flat()),
  };
}
export type NetworkGraph = ReturnType<typeof buildNetworkGraph>;
