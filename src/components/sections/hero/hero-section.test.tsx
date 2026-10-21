import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { hero } from "@/lib/content";

vi.mock("@/components/scene/lazy-hero-scene", () => ({
  LazyHeroScene: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));

import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("is the page's only level-1 heading", () => {
    render(<HeroSection hero={hero} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("describes the scene for people who cannot see it", () => {
    render(<HeroSection hero={hero} />);
    expect(
      screen.getByRole("img", { name: hero.sceneLabel }),
    ).toBeInTheDocument();
  });

  it("keeps the same side padding as the section frames: 48px on every screen size", () => {
    render(<HeroSection hero={hero} />);
    const frame = screen
      .getByRole("heading", { level: 1 })
      .closest(".max-w-7xl") as HTMLElement;
    const paddings = frame.className
      .split(/\s+/)
      .filter((token) => /px-/.test(token));
    expect(paddings).toEqual(["px-12"]);
  });

  it("centers its content up to the lg breakpoint, both ways, and puts it at the bottom from it", () => {
    render(<HeroSection hero={hero} />);
    const section = document.getElementById("hero") as HTMLElement;
    expect(section).toHaveClass("items-center", "lg:items-end");
    const frame = screen
      .getByRole("heading", { level: 1 })
      .closest(".max-w-7xl") as HTMLElement;
    expect(frame).toHaveClass(
      "max-lg:flex",
      "max-lg:flex-col",
      "max-lg:items-center",
      "max-lg:text-center",
    );
  });

  it("enlarges its heading on small screens", () => {
    render(<HeroSection hero={hero} />);
    const header = screen.getByRole("heading", { level: 1 }).parentElement;
    expect(header).toHaveClass("@container");
  });

  it("reports full motion when the visitor has not asked for less", () => {
    render(<HeroSection hero={hero} />);
    expect(document.getElementById("hero")).toHaveAttribute(
      "data-motion",
      "full",
    );
  });
});
