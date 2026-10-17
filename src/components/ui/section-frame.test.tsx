import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionFrame } from "./section-frame";

describe("SectionFrame", () => {
  it("is a region with the given id, named by the heading inside it", () => {
    render(
      <SectionFrame id="demo">
        <h2 id="demo-title">Demo title</h2>
        <p>Body</p>
      </SectionFrame>,
    );
    const region = screen.getByRole("region", { name: "Demo title" });
    expect(region).toHaveAttribute("id", "demo");
  });

  it("puts its children in one shared two-column grid", () => {
    render(
      <SectionFrame id="demo">
        <h2 id="demo-title">Demo title</h2>
        <p>Body</p>
      </SectionFrame>,
    );
    const grid = screen.getByText("Body").parentElement;
    expect(grid).toHaveClass("grid");
    expect(grid).toContainElement(screen.getByText("Demo title"));
  });
});
