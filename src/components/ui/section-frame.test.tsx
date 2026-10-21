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

  it("puts the heading column beside the content from the lg breakpoint, and stacks them below it", () => {
    render(
      <SectionFrame id="demo">
        <h2 id="demo-title">Demo title</h2>
        <p>Body</p>
      </SectionFrame>,
    );
    const grid = screen.getByText("Body").parentElement as HTMLElement;
    const tokens = grid.className.split(/\s+/);
    expect(tokens.some((token) => token.startsWith("lg:grid-cols-["))).toBe(
      true,
    );
    expect(tokens).toContain("lg:gap-x-30");
    expect(
      tokens.filter((token) => /^md:(grid-cols|gap-x)/.test(token)),
    ).toEqual([]);
  });

  it("narrows the gap between its children to 24px up to the lg breakpoint, and keeps 48px from it", () => {
    render(
      <SectionFrame id="demo">
        <h2 id="demo-title">Demo title</h2>
        <p>Body</p>
      </SectionFrame>,
    );
    const grid = screen.getByText("Body").parentElement as HTMLElement;
    expect(grid).toHaveClass("gap-12", "max-lg:gap-6");
  });

  it("keeps the wide gap up to the lg breakpoint when asked to", () => {
    render(
      <SectionFrame id="demo" roomyStack>
        <h2 id="demo-title">Demo title</h2>
        <p>Body</p>
      </SectionFrame>,
    );
    const grid = screen.getByText("Body").parentElement as HTMLElement;
    expect(grid).toHaveClass("gap-12");
    expect(grid).not.toHaveClass("max-lg:gap-6");
  });

  it("keeps 48px (px-12) of side padding on every screen size, with no responsive change", () => {
    render(
      <SectionFrame id="demo">
        <h2 id="demo-title">Demo title</h2>
        <p>Body</p>
      </SectionFrame>,
    );
    const grid = screen.getByText("Body").parentElement as HTMLElement;
    const paddings = grid.className
      .split(/\s+/)
      .filter((token) => /px-/.test(token));
    expect(paddings).toEqual(["px-12"]);
  });
});
