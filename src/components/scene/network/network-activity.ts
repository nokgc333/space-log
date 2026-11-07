import type { NetworkGraph } from "./network-graph";
import * as S from "./network-settings";

export function createActivityState(count: number) {
  return {
    values: new Float32Array(count),
    hover: new Float32Array(count),
    next: new Float32Array(count),
    hops: new Int32Array(count).fill(-1),
    queue: new Uint32Array(count),
    age: -1,
    duration: 0,
    strength: 1,
  };
}
type ActivityState = ReturnType<typeof createActivityState>;

export function startPulse(
  state: ActivityState,
  graph: NetworkGraph,
  seed: number,
  strength = 1,
): void {
  if (seed < 0 || seed >= state.values.length) return;
  state.hops.fill(-1);
  state.queue[0] = seed;
  state.hops[seed] = 0;
  state.age = 0;
  state.strength = strength;
  let tail = 1;
  let lastHop = 0;
  for (let head = 0; head < tail; head++) {
    const node = state.queue[head];
    lastHop = state.hops[node];
    if (lastHop >= S.PULSE_MAX_HOPS) continue;
    for (
      let edge = graph.offsets[node];
      edge < graph.offsets[node + 1];
      edge++
    ) {
      const neighbor = graph.neighbors[edge];
      if (state.hops[neighbor] >= 0) continue;
      state.hops[neighbor] = lastHop + 1;
      state.queue[tail++] = neighbor;
    }
  }
  state.duration = lastHop * S.PULSE_HOP_SECONDS + S.PULSE_TAIL_SECONDS * 5;
}

export function stepActivity(
  state: ActivityState,
  graph: NetworkGraph,
  elapsed: number,
  query: number,
): void {
  const delta = Math.min(Math.max(elapsed, 0), S.MAX_STEP_SECONDS);
  if (!delta) return;
  const decay = Math.exp(-S.ACTIVITY_DECAY * delta);
  const relay = 1 - Math.exp(-S.RELAY_SPEED * delta);
  if (state.age >= 0)
    state.age = state.age + delta > state.duration ? -1 : state.age + delta;
  for (let node = 0; node < state.values.length; node++) {
    let incoming = 0;
    for (let edge = graph.offsets[node]; edge < graph.offsets[node + 1]; edge++)
      incoming = Math.max(
        incoming,
        state.hover[graph.neighbors[edge]] * S.EDGE_RETENTION,
      );
    const current = state.hover[node];
    state.next[node] = Math.max(
      current * decay,
      (current + (incoming - current) * relay) * decay,
      node === query ? 1 : 0,
    );
    const age = state.age - state.hops[node] * S.PULSE_HOP_SECONDS;
    const pulse =
      state.age >= 0 && state.hops[node] >= 0 && age >= 0
        ? state.strength *
          Math.exp(
            -age / S.PULSE_TAIL_SECONDS - state.hops[node] * S.PULSE_HOP_DECAY,
          )
        : 0;
    state.values[node] = Math.max(state.next[node], pulse);
  }
  state.hover.set(state.next);
}
