import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GitHubMark } from "./github-mark";

describe("GitHubMark", () => {
  it("is a decorative svg drawn in the current text color", () => {
    const { container } = render(<GitHubMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(svg?.querySelector("path")).toHaveAttribute("d");
  });

  it("keeps the 16 by 16 grid of the original mark", () => {
    const { container } = render(<GitHubMark />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 16 16",
    );
  });

  it("takes its size from the class it is given", () => {
    const { container } = render(<GitHubMark className="size-4" />);
    expect(container.querySelector("svg")).toHaveClass("size-4");
  });
});
