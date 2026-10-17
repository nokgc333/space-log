"use client";

import { type RefObject, useEffect, useRef } from "react";

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
      const rect = source.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      current.y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
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
      const rect = source.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      current.clickX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      current.clickY = 1 - ((event.clientY - rect.top) / rect.height) * 2;
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
