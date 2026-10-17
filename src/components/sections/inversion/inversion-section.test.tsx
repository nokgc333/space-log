import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { inversion } from "@/lib/content";

import { InversionSection } from "./inversion-section";

describe("InversionSection", () => {
  it("shows every paragraph of the body", () => {
    render(<InversionSection inversion={inversion} />);
    for (const paragraph of inversion.body)
      expect(screen.getByText(paragraph)).toBeInTheDocument();
  });

  it("is named by its own heading, and the nav link can reach it", () => {
    render(<InversionSection inversion={inversion} />);
    const section = screen.getByRole("region", {
      name: inversion.heading.title,
    });
    expect(section).toHaveAttribute("id", "inversion");
  });
});
