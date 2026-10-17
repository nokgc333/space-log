import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/scene/lazy-hero-scene", () => ({
  LazyHeroScene: () => null,
}));

import Home from "./page";

describe("Home", () => {
  it("renders exactly one non-empty top-level heading", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).not.toBe("");
  });
});
