export const CAMERA_DISTANCE = 7;
export const CAMERA_FOV = 45;
export const NODE_SIZE = 0.04;
export const NODE_OPACITY = 0.7;
export const EDGE_OPACITY = 0.045;
export const ACTIVE_EDGE_OPACITY = 0.45;

export const SIGNAL_CURVE = 0.6;
export const LOCAL_EDGE_RADIUS = 0.55;
export const LOCAL_NEIGHBORS = 3;
export const ROTATION_SPEED = 0.08;
export const QUERY_RADIUS_PIXELS = 32;
export const ACTIVITY_DECAY = 1.8;
export const RELAY_SPEED = 12;
export const EDGE_RETENTION = 0.9;
export const PULSE_HOP_SECONDS = 0.055;
export const PULSE_TAIL_SECONDS = 0.4;
export const PULSE_HOP_DECAY = 0.045;
export const PULSE_MAX_HOPS = 24;
export const IDLE_PULSE_INTERVAL = 3.5;
export const IDLE_PULSE_STRENGTH = 0.5;
export const MAX_STEP_SECONDS = 1 / 30;
export const COLOR_RESPONSE = 1.83;
export const PALETTE = {
  light: { node: "#606060", signal: "#f05000" },
  dark: { node: "#d4d4d8", signal: "#ff6000" },
} as const;
