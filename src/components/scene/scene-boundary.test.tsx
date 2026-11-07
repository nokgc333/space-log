import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SceneBoundary } from "./scene-boundary";

function Broken(): never {
  throw new Error("WebGL is not available");
}

describe("SceneBoundary", () => {
  it("shows the fallback when the scene cannot start", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SceneBoundary fallback={<p>still image</p>}>
        <Broken />
      </SceneBoundary>,
    );
    expect(screen.getByText("still image")).toBeInTheDocument();
  });

  it("logs the plain text when something other than an Error is thrown", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    function BrokenWithText(): never {
      throw "no graphics card";
    }
    render(
      <SceneBoundary fallback={<p>still image</p>}>
        <BrokenWithText />
      </SceneBoundary>,
    );
    expect(warn).toHaveBeenCalledWith(
      "The 3D scene could not start:",
      "no graphics card",
    );
  });
});
