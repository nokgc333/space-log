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

  it("reports full motion when the visitor has not asked for less", () => {
    render(<HeroSection hero={hero} />);
    expect(document.getElementById("hero")).toHaveAttribute(
      "data-motion",
      "full",
    );
  });

  it("reports reduced motion when the visitor asked for less", () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(<HeroSection hero={hero} />);
    expect(document.getElementById("hero")).toHaveAttribute(
      "data-motion",
      "reduced",
    );
    window.matchMedia = original;
  });
});
