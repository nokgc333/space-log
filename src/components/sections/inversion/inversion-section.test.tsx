import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { inversion as realInversion } from "@/lib/content";
import type { Inversion } from "@/lib/content";

import { InversionSection } from "./inversion-section";

const INVERSION: Inversion = {
  heading: { label: "01 / TEST", title: "TEST TITLE", subtitle: "sub" },
  body: [
    { lead: "First lead,", main: "then the KEY main", highlight: "KEY" },
    { main: "Second main", tail: "closing tail." },
  ],
};

const statements = () => [
  screen.getByText("First lead,").closest("p") as HTMLElement,
  screen.getByText("Second main").closest("p") as HTMLElement,
];

describe("InversionSection", () => {
  it("shows the lead and the main text of every statement in reading order", () => {
    render(<InversionSection inversion={INVERSION} />);
    const [first, second] = statements();
    expect(first).toHaveTextContent("First lead,then the KEY main");
    expect(second).toHaveTextContent("Second mainclosing tail.");
  });

  it("shows no number before the statements", () => {
    const { container } = render(<InversionSection inversion={INVERSION} />);
    expect(screen.queryByText(/^0\d$/)).toBeNull();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it("keeps the words around the highlighted phrase in the same sentence", () => {
    render(<InversionSection inversion={INVERSION} />);
    expect(screen.getByText("KEY").parentElement).toHaveTextContent(
      "then the KEY main",
    );
  });

  it("puts the tail after the main text of its statement", () => {
    render(<InversionSection inversion={INVERSION} />);
    const second = statements()[1];
    const [main, tail] = [...second.children];
    expect(main).toHaveTextContent("Second main");
    expect(tail).toHaveTextContent("closing tail.");
  });

  it("adds no lead element, no tail element and no inverted block when a statement has none of them", () => {
    const plain: Inversion = {
      ...INVERSION,
      body: [{ main: "Plain main" }],
    };
    render(<InversionSection inversion={plain} />);
    const paragraph = screen
      .getByText("Plain main")
      .closest("p") as HTMLElement;
    expect(paragraph.querySelectorAll(".bg-ink")).toHaveLength(0);
    expect(paragraph.children).toHaveLength(1);
  });

  it("does not break the text with line breaks or newlines", () => {
    const { container } = render(<InversionSection inversion={INVERSION} />);
    expect(container.querySelectorAll("br")).toHaveLength(0);
    expect(container.textContent).not.toContain("\n");
  });

  it("draws no rule above the statements", () => {
    const { container } = render(<InversionSection inversion={INVERSION} />);
    expect(container.querySelectorAll('[class*="border-t"]').length).toBe(1);
  });

  it("is named by its own heading, and the nav link can reach it", () => {
    render(<InversionSection inversion={INVERSION} />);
    const section = screen.getByRole("region", { name: "TEST TITLE" });
    expect(section).toHaveAttribute("id", "inversion");
  });

  it("shows every statement of the real content", () => {
    const { container } = render(
      <InversionSection inversion={realInversion} />,
    );
    for (const statement of realInversion.body)
      expect(container).toHaveTextContent(
        `${statement.main}${"tail" in statement ? statement.tail : ""}`,
      );
  });
});
