"use client";

import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import type { RefObject } from "react";
import { clampDpr } from "../scene-settings";
import { NetworkCloud, type SceneProps } from "./network-cloud";
import * as S from "./network-settings";

export default function NetworkScene({ frameLoop, eventSource }: SceneProps) {
  const { resolvedTheme } = useTheme();
  const dpr = clampDpr(
    typeof window === "undefined" ? 1 : window.devicePixelRatio,
  );
  return (
    <Canvas
      frameloop={frameLoop}
      dpr={dpr}
      camera={{ position: [0, 0, S.CAMERA_DISTANCE], fov: S.CAMERA_FOV }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
    >
      <NetworkCloud
        isDark={resolvedTheme === "dark"}
        frameLoop={frameLoop}
        eventSource={eventSource}
      />
    </Canvas>
  );
}
