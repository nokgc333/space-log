"use client";

import dynamic from "next/dynamic";
import { type RefObject, useRef } from "react";

import { useAfterIdle } from "@/components/ui/use-after-idle";
import { usePrefersReducedMotion } from "@/components/ui/use-prefers-reduced-motion";

import { SceneBoundary } from "./scene-boundary";
import { frameLoopFor } from "./scene-settings";
import { useSceneVisibility } from "./use-scene-visibility";

const HeroScene = dynamic(() => import("./network/network-scene"), {
  ssr: false,
});

type Props = {
  label: string;
  fallbackText: string;
  eventSource: RefObject<HTMLElement | null>;
};

export function LazyHeroScene({ label, fallbackText, eventSource }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const isIdle = useAfterIdle();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isInView, isDocumentVisible } = useSceneVisibility(container);
  const fallback = (
    <p className="p-4 font-mono text-xs text-muted">{fallbackText}</p>
  );

  return (
    <div
      ref={container}
      role="img"
      aria-label={label}
      className="absolute inset-0"
    >
      {isIdle ? (
        <SceneBoundary fallback={fallback}>
          <HeroScene
            eventSource={eventSource}
            frameLoop={frameLoopFor({
              isInView,
              isDocumentVisible,
              prefersReducedMotion,
            })}
          />
        </SceneBoundary>
      ) : null}
    </div>
  );
}
