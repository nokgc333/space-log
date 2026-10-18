import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useNetworkInput } from "./use-network-input";

function sectionSource() {
  const current = document.createElement("section");
  vi.spyOn(current, "getBoundingClientRect").mockReturnValue(
    new DOMRect(100, 50, 400, 200),
  );
  return { current };
}

describe("useNetworkInput", () => {
  it("uses section-relative client coordinates when the pointer moves over a child", () => {
    const source = sectionSource();
    const child = document.createElement("div");
    source.current.append(child);
    const { result, unmount } = renderHook(() => useNetworkInput(source, true));
    act(() =>
      child.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 400,
          clientY: 100,
        }),
      ),
    );
    expect(result.current.current.x).toBe(0.5);
    expect(result.current.current.y).toBe(0.5);
    expect(result.current.current.inside).toBe(true);
    act(() => source.current.dispatchEvent(new Event("pointerleave")));
    expect(result.current.current.inside).toBe(false);
    unmount();
  });

  it("queues a click and clears pending input when demand mode starts", () => {
    const source = sectionSource();
    const { result, rerender, unmount } = renderHook(
      ({ enabled }) => useNetworkInput(source, enabled),
      { initialProps: { enabled: true } },
    );
    act(() =>
      source.current.dispatchEvent(
        new MouseEvent("click", { clientX: 300, clientY: 150 }),
      ),
    );
    expect(result.current.current.pendingClick).toBe(true);
    expect(result.current.current.clickX).toBe(0);
    expect(result.current.current.clickY).toBe(0);
    rerender({ enabled: false });
    expect(result.current.current.pendingClick).toBe(false);
    act(() => source.current.dispatchEvent(new MouseEvent("click")));
    expect(result.current.current.pendingClick).toBe(false);
    unmount();
  });

  it("leaves no hover or listeners behind when touch input ends and the scene unmounts", () => {
    const source = sectionSource();
    const { result, unmount } = renderHook(() => useNetworkInput(source, true));
    const move = new MouseEvent("pointermove", { clientX: 300, clientY: 150 });
    Object.defineProperty(move, "pointerType", { value: "touch" });
    act(() => source.current.dispatchEvent(move));
    expect(result.current.current.inside).toBe(false);
    unmount();
    source.current.dispatchEvent(new MouseEvent("click"));
    expect(result.current.current.pendingClick).toBe(false);
  });
});
