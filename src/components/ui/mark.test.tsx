import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Mark } from "./mark";

describe("Mark", () => {
  it("is hidden from screen readers (it only decorates)", () => {
    const { container } = render(<Mark />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("draws an outlined square with a dot by default", () => {
    const { container } = render(<Mark />);
    expect(container.querySelector("rect")).not.toBeNull();
    expect(container.querySelector("circle")).not.toBeNull();
  });

  it("draws a filled square with a dot-shaped hole when inverted", () => {
    const { container } = render(<Mark isFilled />);
    expect(container.querySelector("path")).toHaveAttribute(
      "fill-rule",
      "evenodd",
    );
    expect(container.querySelector("circle")).toBeNull();
  });
});
