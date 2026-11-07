import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LazyHeroScene } from "./lazy-hero-scene";

const mocks = vi.hoisted(() => ({ shouldFail: false }));

vi.mock("./network/network-scene", () => ({
  default: ({ frameLoop }: { frameLoop: string }) => {
    if (mocks.shouldFail) throw new Error("no WebGL");
    return <div data-testid="scene" data-frame-loop={frameLoop} />;
  },
}));

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let reportIntersection: ObserverCallback = () => {};
let runIdle: () => void = () => {};
const original = {
  requestIdleCallback: window.requestIdleCallback,
  cancelIdleCallback: window.cancelIdleCallback,
  matchMedia: window.matchMedia,
};

function stubReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  mocks.shouldFail = false;
  stubReducedMotion(false);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: ObserverCallback) {
        reportIntersection = callback;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  window.requestIdleCallback = ((callback: () => void) => {
    runIdle = callback;
    return 1;
  }) as never;
  window.cancelIdleCallback = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.requestIdleCallback = original.requestIdleCallback;
  window.cancelIdleCallback = original.cancelIdleCallback;
  window.matchMedia = original.matchMedia;
});

async function renderHero() {
  render(
    <LazyHeroScene
      label="The hero scene"
      fallbackText="The scene is not available."
      eventSource={{ current: null }}
    />,
  );
  await act(async () => runIdle());
}

describe("LazyHeroScene", () => {
  it("describes the scene as an image and does not load it before the browser is idle", () => {
    render(
      <LazyHeroScene
        label="The hero scene"
        fallbackText="x"
        eventSource={{ current: null }}
      />,
    );

    expect(screen.getByRole("img", { name: "The hero scene" })).toBeVisible();
    expect(screen.queryByTestId("scene")).not.toBeInTheDocument();
  });

  it("loads the scene once the browser is idle and runs it while it is on screen", async () => {
    await renderHero();

    expect(await screen.findByTestId("scene")).toHaveAttribute(
      "data-frame-loop",
      "always",
    );
  });

  it("pauses the scene when it scrolls out of view and resumes it when it returns", async () => {
    await renderHero();
    const scene = await screen.findByTestId("scene");

    act(() => reportIntersection([{ isIntersecting: false }]));
    expect(scene).toHaveAttribute("data-frame-loop", "demand");

    act(() => reportIntersection([{ isIntersecting: true }]));
    expect(scene).toHaveAttribute("data-frame-loop", "always");
  });

  it("pauses the scene for visitors who asked for less motion", async () => {
    stubReducedMotion(true);
    await renderHero();

    expect(await screen.findByTestId("scene")).toHaveAttribute(
      "data-frame-loop",
      "demand",
    );
  });

  it("shows the fallback text, and only warns in the log, when the scene cannot start", async () => {
    mocks.shouldFail = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    await renderHero();

    expect(
      await screen.findByText("The scene is not available."),
    ).toBeVisible();
    expect(warn).toHaveBeenCalled();
  });
});
