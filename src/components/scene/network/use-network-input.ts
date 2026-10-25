"use client";

import { type RefObject, useEffect, useRef } from "react";

import { normalizePointer } from "./network-pointer";

export type NetworkInput = {
  x: number;
  y: number;
  inside: boolean;
  clickX: number;
  clickY: number;
  pendingClick: boolean;
};

export function useNetworkInput(
  eventSource: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const input = useRef<NetworkInput>({
    x: 0,
    y: 0,
    inside: false,
    clickX: 0,
    clickY: 0,
    pendingClick: false,
  });
  useEffect(() => {
    const source = eventSource.current;
    const current = input.current;
    current.inside = false;
    current.pendingClick = false;
    if (!source || !enabled) return;

    const move = (event: PointerEvent) => {
      const point = normalizePointer(
        source.getBoundingClientRect(),
        event.clientX,
        event.clientY,
      );
      if (!point) return;
      current.x = point.x;
      current.y = point.y;
      current.inside = event.pointerType !== "touch";
    };
    const leave = () => {
      current.inside = false;
    };
    const click = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (
        event.target instanceof Element &&
        event.target.closest("a, button, input, select, textarea")
      )
        return;
      const point = normalizePointer(
        source.getBoundingClientRect(),
        event.clientX,
        event.clientY,
      );
      if (!point) return;
      current.clickX = point.x;
      current.clickY = point.y;
      current.pendingClick = true;
    };
    source.addEventListener("pointermove", move);
    source.addEventListener("pointerleave", leave);
    source.addEventListener("pointercancel", leave);
    source.addEventListener("click", click);
    return () => {
      source.removeEventListener("pointermove", move);
      source.removeEventListener("pointerleave", leave);
      source.removeEventListener("pointercancel", leave);
      source.removeEventListener("click", click);
    };
  }, [eventSource, enabled]);
  return input;
}
