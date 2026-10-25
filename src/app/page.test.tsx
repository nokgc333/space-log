import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { site } from "@/lib/content";

vi.mock("@/components/scene/lazy-hero-scene", () => ({
  LazyHeroScene: () => <div role="img" aria-label="scene" />,
}));

import Home from "./page";

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});

describe("Home", () => {
  it("lays out the header, the main sections in order, the footer and the contact shortcut", () => {
    const { container } = render(<Home />);
    const ids = [...container.querySelectorAll("main > section")].map(
      (section) => section.id,
    );

    expect(container.firstElementChild?.tagName).toBe("HEADER");
    expect(ids).toEqual([
      "hero",
      "inversion",
      "news",
      "pipeline",
      "tools",
      "contact",
    ]);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    const shortcut = container.lastElementChild;
    expect(shortcut).toHaveTextContent(site.contactShortcut);
    expect(shortcut).toHaveAttribute("href", "#contact");
  });

  it("has one main landmark that the skip link can jump to", () => {
    const { container } = render(<Home />);

    expect(container.querySelectorAll("main#main")).toHaveLength(1);
  });
});
