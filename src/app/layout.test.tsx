import { describe, expect, it, vi } from "vitest";

vi.mock("./fonts", () => ({
  displayFont: { variable: "font-display-var" },
  monoFont: { variable: "font-mono-var" },
  bodyFont: { variable: "font-body-var" },
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("marks the document as Japanese and exposes the three font variables", () => {
    const html = RootLayout({ children: null });
    expect(html.props.lang).toBe("ja");
    expect(html.props.className).toContain("font-display-var");
    expect(html.props.className).toContain("font-mono-var");
    expect(html.props.className).toContain("font-body-var");
    expect(html.props.suppressHydrationWarning).toBe(true);
  });
});
