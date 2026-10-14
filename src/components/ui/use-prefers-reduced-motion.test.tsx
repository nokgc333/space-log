import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const originalMatchMedia = window.matchMedia;

function stubReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function Probe() {
  return <span>{String(usePrefersReducedMotion())}</span>;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("usePrefersReducedMotion", () => {
  it("is true on the server, where the preference is unknown (the safe default)", () => {
    expect(renderToString(<Probe />)).toContain("true");
  });

  it("is false in a browser that did not ask for less motion", () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("is true in a browser that asked for less motion", () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("asks the browser about the reduced-motion media query", () => {
    stubReducedMotion(false);
    renderHook(() => usePrefersReducedMotion());
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
  });
});
