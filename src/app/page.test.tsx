import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/scene/lazy-hero-scene", () => ({
  LazyHeroScene: () => null,
}));
vi.mock("@/app/actions/submit-contact", () => ({ submitContact: vi.fn() }));

import Home from "./page";

describe("Home", () => {
  it("ends the sections with the contact section the shortcut points at", () => {
    render(<Home />);
    const sections = screen.getAllByRole("region");
    expect(sections[sections.length - 1]).toHaveAttribute("id", "contact");
  });

  it("renders exactly one non-empty top-level heading", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).not.toBe("");
  });
});
