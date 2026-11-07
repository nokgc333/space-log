import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSceneVisibility } from "./use-scene-visibility";

type Callback = (entries: { isIntersecting: boolean }[]) => void;

let callback: Callback = () => {};
const observe = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(received: Callback) {
        callback = received;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  observe.mockClear();
  disconnect.mockClear();
});

function setVisibility(state: "visible" | "hidden") {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(state);
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useSceneVisibility", () => {
  it("assumes the scene is on screen and the tab is shown until told otherwise", () => {
    const target = { current: document.createElement("div") };
    const { result } = renderHook(() => useSceneVisibility(target));

    expect(result.current).toEqual({ isInView: true, isDocumentVisible: true });
    expect(observe).toHaveBeenCalledWith(target.current);
  });

  it("follows the element as it scrolls out of and back into view", () => {
    const target = { current: document.createElement("div") };
    const { result } = renderHook(() => useSceneVisibility(target));

    act(() => callback([{ isIntersecting: false }]));
    expect(result.current.isInView).toBe(false);

    act(() => callback([{ isIntersecting: true }]));
    expect(result.current.isInView).toBe(true);
  });

  it("follows the tab being hidden and shown", () => {
    const target = { current: document.createElement("div") };
    const { result } = renderHook(() => useSceneVisibility(target));

    act(() => setVisibility("hidden"));
    expect(result.current.isDocumentVisible).toBe(false);

    act(() => setVisibility("visible"));
    expect(result.current.isDocumentVisible).toBe(true);
  });

  it("observes nothing when the element is not there", () => {
    renderHook(() => useSceneVisibility({ current: null }));

    expect(observe).not.toHaveBeenCalled();
  });

  it("stops observing and listening when the component unmounts", () => {
    const target = { current: document.createElement("div") };
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useSceneVisibility(target));

    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });
});
