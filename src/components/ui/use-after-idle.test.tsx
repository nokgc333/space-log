import { act, cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_TIMEOUT_MS, useAfterIdle } from "./use-after-idle";

const original = {
  requestIdleCallback: window.requestIdleCallback,
  cancelIdleCallback: window.cancelIdleCallback,
};

function stubIdleCallbacks() {
  const callbacks = new Map<number, () => void>();
  let nextId = 1;
  const request = vi.fn((callback: () => void) => {
    callbacks.set(nextId, callback);
    return nextId++;
  });
  const cancel = vi.fn((id: number) => callbacks.delete(id));
  window.requestIdleCallback = request as never;
  window.cancelIdleCallback = cancel;
  return { callbacks, request, cancel };
}

function Probe() {
  return <span>{String(useAfterIdle())}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.requestIdleCallback = original.requestIdleCallback;
  window.cancelIdleCallback = original.cancelIdleCallback;
});

describe("useAfterIdle", () => {
  it("is false on the server", () => {
    expect(renderToString(<Probe />)).toContain("false");
  });

  it("stays false until the browser reports an idle period", () => {
    const { callbacks } = stubIdleCallbacks();
    const { result } = renderHook(() => useAfterIdle());

    expect(result.current).toBe(false);
    expect(callbacks.size).toBe(1);
  });

  it("becomes true when the idle period starts", () => {
    const { callbacks } = stubIdleCallbacks();
    const { result } = renderHook(() => useAfterIdle());

    act(() => callbacks.get(1)?.());

    expect(result.current).toBe(true);
  });

  it("asks for an idle period with a deadline, so a busy page still starts", () => {
    const { request } = stubIdleCallbacks();
    renderHook(() => useAfterIdle());

    expect(request).toHaveBeenCalledWith(expect.any(Function), {
      timeout: IDLE_TIMEOUT_MS,
    });
  });

  it("cancels the idle request when the component unmounts first", () => {
    const { cancel } = stubIdleCallbacks();
    const { unmount } = renderHook(() => useAfterIdle());

    unmount();

    expect(cancel).toHaveBeenCalledWith(1);
  });

  it("falls back to a timer in browsers without requestIdleCallback", () => {
    window.requestIdleCallback = undefined as never;
    const { result } = renderHook(() => useAfterIdle());

    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS);
    });
    expect(result.current).toBe(true);
  });

  it("clears the fallback timer when the component unmounts first", () => {
    window.requestIdleCallback = undefined as never;
    const { result, unmount } = renderHook(() => useAfterIdle());

    unmount();
    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS);
    });

    expect(result.current).toBe(false);
  });
});
