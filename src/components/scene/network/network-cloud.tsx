"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { FrameLoop } from "../scene-settings";
import {
  createNetworkState,
  type NetworkState,
  stepNetworkFrame,
} from "./network-frame";
import * as S from "./network-settings";
import { useNetworkInput } from "./use-network-input";

export type SceneProps = {
  frameLoop: FrameLoop;
  eventSource: RefObject<HTMLElement | null>;
};

function createGeometry(network: NetworkState) {
  const attribute = (array: Float32Array, size: number) =>
    new THREE.BufferAttribute(array, size).setUsage(THREE.DynamicDrawUsage);
  const position = attribute(network.buffers.positions, 3);
  return {
    points: {
      attributes: { position, color: attribute(network.nodeColors, 3) },
    },
    lines: {
      attributes: { position, color: attribute(network.edgeColors, 4) },
      index: new THREE.BufferAttribute(network.graph.edges, 1),
    },
  };
}

export function NetworkCloud({
  isDark,
  frameLoop,
  eventSource,
}: SceneProps & { isDark: boolean }) {
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const { camera, size, viewport, invalidate } = useThree();
  const input = useNetworkInput(eventSource, frameLoop === "always");
  const [network] = useState(() => createNetworkState(isDark));
  const [geometry] = useState(() => createGeometry(network));
  const projection = useMemo(() => new THREE.Matrix4(), []);
  const view = useMemo(
    () => ({
      width: size.width,
      height: size.height,
      worldWidth: viewport.width,
      worldHeight: viewport.height,
      matrix: projection.elements,
    }),
    [size.width, size.height, viewport.width, viewport.height, projection],
  );
  useEffect(() => {
    invalidate();
  }, [isDark, frameLoop, invalidate]);

  useFrame((_, elapsed) => {
    const current = group.current;
    const pointGeometry = points.current?.geometry;
    const lineGeometry = lines.current?.geometry;
    if (!current || !pointGeometry || !lineGeometry) return;
    projection.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    stepNetworkFrame(network, input.current, {
      isDark,
      frameLoop,
      view,
      elapsed,
    });
    current.rotation.y = network.rotation;
    pointGeometry.attributes.position.needsUpdate = true;
    pointGeometry.attributes.color.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry {...geometry.lines} />
        <lineBasicMaterial
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <points ref={points} frustumCulled={false}>
        <bufferGeometry {...geometry.points} />
        <pointsMaterial
          vertexColors
          size={S.NODE_SIZE}
          sizeAttenuation
          transparent
          opacity={S.NODE_OPACITY}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
