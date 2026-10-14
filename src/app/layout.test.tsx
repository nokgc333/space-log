import { describe, expect, it, vi } from "vitest";

vi.mock("./fonts", () => ({
  displayFont: { variable: "font-display-var" },
  monoFont: { variable: "font-mono-var" },
  bodyFont: { variable: "font-body-var" },
}));

import { site } from "@/lib/content";

import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("marks the document as Japanese and exposes the three font variables", () => {
    const html = RootLayout({ children: null });
    expect(html.props.lang).toBe("ja");
    expect(html.props.className).toContain("font-display-var");
    expect(html.props.className).toContain("font-mono-var");
    expect(html.props.className).toContain("font-body-var");
    expect(html.props.suppressHydrationWarning).toBe(true);
  });

  it("takes the title and description from the site content", () => {
    expect(metadata.title).toBe(site.name);
    expect(metadata.description).toBe(site.description);
  });
});
