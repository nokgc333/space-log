import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeading } from "./section-heading";

const HEADING = {
  label: "01 / LABEL",
  title: "Title",
  subtitle: "Subtitle",
  lead: "Lead sentence.",
};

describe("SectionHeading", () => {
  it("renders the title as a level-2 heading with the given id", () => {
    render(<SectionHeading id="x-heading" heading={HEADING} />);
    const title = screen.getByRole("heading", { level: 2, name: "Title" });
    expect(title).toHaveAttribute("id", "x-heading");
  });

  it("renders a level-1 heading when asked to", () => {
    render(<SectionHeading id="x-heading" heading={HEADING} as="h1" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Title" }),
    ).toBeInTheDocument();
  });

  it("shows the label, subtitle and lead", () => {
    render(<SectionHeading id="x-heading" heading={HEADING} />);
    for (const text of [HEADING.label, HEADING.subtitle, HEADING.lead]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("shows a line break written in the lead as a line break", () => {
    const heading = { ...HEADING, lead: "First line.\nSecond line." };
    render(<SectionHeading id="x-heading" heading={heading} />);
    const lead = screen.getByText(/First line/);
    expect(lead.textContent).toBe("First line.\nSecond line.");
    expect(lead).toHaveClass("whitespace-pre-line");
  });

  it("omits the lead when there is none", () => {
    const heading = { label: "L", title: "T", subtitle: "S" };
    render(<SectionHeading id="x-heading" heading={heading} />);
    expect(screen.queryByText(HEADING.lead)).toBeNull();
  });
});
