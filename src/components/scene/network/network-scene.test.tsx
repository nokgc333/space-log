import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NetworkScene from "./network-scene";
import * as S from "./network-settings";

type CanvasProps = Record<string, unknown> & {
  children: ReactElement<{ isDark: boolean }>;
};

const mocks = vi.hoisted(() => ({
  canvasProps: null as CanvasProps | null,
  theme: "light" as string | undefined,
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: (props: CanvasProps) => {
    mocks.canvasProps = props;
    return <div data-testid="canvas" />;
  },
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mocks.theme }),
}));

const eventSource = { current: null };
const originalRatio = window.devicePixelRatio;

function renderScene(frameLoop: "always" | "demand" = "always") {
  render(<NetworkScene frameLoop={frameLoop} eventSource={eventSource} />);
  return mocks.canvasProps as CanvasProps;
}

beforeEach(() => {
  mocks.theme = "light";
});

afterEach(() => {
  Object.defineProperty(window, "devicePixelRatio", { value: originalRatio });
});

function setRatio(value: number) {
  Object.defineProperty(window, "devicePixelRatio", {
    value,
    configurable: true,
  });
}

describe("NetworkScene", () => {
  it("passes the frame loop on, so the canvas stops drawing when the scene is paused", () => {
    expect(renderScene("demand").frameloop).toBe("demand");
    expect(renderScene("always").frameloop).toBe("always");
  });

  it("places the camera from the scene settings", () => {
    expect(renderScene().camera).toEqual({
      position: [0, 0, S.CAMERA_DISTANCE],
      fov: S.CAMERA_FOV,
    });
  });

  it("draws at the screen's pixel ratio up to the limit", () => {
    setRatio(1.5);
    expect(renderScene().dpr).toBe(1.5);

    setRatio(3);
    expect(renderScene().dpr).toBe(2);
  });

  it("lets the pointer pass through the canvas and listens on the hero section", () => {
    const props = renderScene();

    expect(props.style).toEqual({ pointerEvents: "none" });
    expect(props.eventSource).toBe(eventSource);
    expect(props.eventPrefix).toBe("client");
  });

  it("draws the cloud with the colors of the dark theme only when it is dark", () => {
    mocks.theme = "dark";
    expect(renderScene().children.props.isDark).toBe(true);

    mocks.theme = "light";
    expect(renderScene().children.props.isDark).toBe(false);

    mocks.theme = undefined;
    expect(renderScene().children.props.isDark).toBe(false);
  });
});
