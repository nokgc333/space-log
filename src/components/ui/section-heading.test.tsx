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

  it("centers the header and its text up to the lg breakpoint, and keeps them at the start from it", () => {
    render(<SectionHeading id="x-heading" heading={HEADING} />);
    const header = screen.getByRole("heading", { level: 2 })
      .parentElement as HTMLElement;
    expect(header).toHaveClass("max-lg:mx-auto", "max-lg:text-center");
    expect(header.className).not.toMatch(/(^|\s)(mx-auto|text-center)(\s|$)/);
  });

  it("keeps the plain sizes at every screen size by default, with no size container", () => {
    render(<SectionHeading id="x-heading" heading={HEADING} />);
    const label = screen.getByText(HEADING.label);
    const title = screen.getByRole("heading", { level: 2 });
    const subtitle = screen.getByText(HEADING.subtitle);
    const header = title.parentElement as HTMLElement;
    expect(header).not.toHaveClass("@container");
    for (const element of [label, title, subtitle])
      expect(element.className).not.toMatch(/(^|\s)max-(md|lg):text-\[/);
    expect(label).toHaveClass("text-xs");
    expect(title).toHaveClass("text-4xl", "md:text-5xl");
    expect(subtitle).toHaveClass("text-sm");
  });

  describe("when enlarged on small screens", () => {
    it("makes the header a size container so the heading text can follow its width", () => {
      render(
        <SectionHeading id="x-heading" heading={HEADING} enlargeOnSmall />,
      );
      const header = screen.getByRole("heading", { level: 2 }).parentElement;
      expect(header).toHaveClass("@container");
    });

    it("draws the label, the title and the subtitle 1.5 times as big up to the lg breakpoint, capped to fit their width", () => {
      render(
        <SectionHeading id="x-heading" heading={HEADING} enlargeOnSmall />,
      );
      const label = screen.getByText(HEADING.label);
      const title = screen.getByRole("heading", { level: 2 });
      const subtitle = screen.getByText(HEADING.subtitle);

      expect(label).toHaveClass("text-xs");
      expect(label.className).toMatch(
        /(^|\s)max-lg:text-\[length:min\(1\.125rem,[\d.]+cqw\)\](\s|$)/,
      );
      expect(title).toHaveClass("text-4xl", "md:text-5xl");
      expect(title.className).toMatch(
        /(^|\s)max-md:text-\[length:min\(3\.375rem,[\d.]+cqw\)\](\s|$)/,
      );
      expect(title.className).toMatch(
        /(^|\s)md:max-lg:text-\[length:min\(4\.5rem,[\d.]+cqw\)\](\s|$)/,
      );
      expect(subtitle).toHaveClass("text-sm", "max-lg:text-[length:1.3125rem]");
    });
  });

  it("shows a line break written in the lead as a line break", () => {
    const heading = { ...HEADING, lead: "First line.\nSecond line." };
    render(<SectionHeading id="x-heading" heading={heading} />);
    const lead = screen.getByText(/First line/);
    expect(lead.textContent).toBe("First line.\nSecond line.");
    expect(lead).toHaveClass("whitespace-pre-line");
  });

  it("shows a line break written in the title as a line break", () => {
    const heading = { ...HEADING, title: "FROM NODE\nTO SHOT" };
    render(<SectionHeading id="x-heading" heading={heading} />);
    const title = screen.getByRole("heading", { level: 2 });
    expect(title.textContent).toBe("FROM NODE\nTO SHOT");
    expect(title).toHaveClass("whitespace-pre-line");
  });

  it("omits the lead when there is none", () => {
    const heading = { label: "L", title: "T", subtitle: "S" };
    render(<SectionHeading id="x-heading" heading={heading} />);
    expect(screen.queryByText(HEADING.lead)).toBeNull();
  });
});
