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

  it("keeps every part inline at every screen size, with no responsive variant at all", () => {
    render(<InversionSection inversion={INVERSION} />);
    for (const part of [
      screen.getByText("First lead,"),
      screen.getByText(/then the/),
      screen.getByText("Second main"),
      screen.getByText("closing tail."),
    ]) {
      const tokens = part.className.split(/\s+/);
      expect(tokens).not.toContain("block");
      expect(tokens.filter((token) => /^[^[]*:/.test(token))).toEqual([]);
      expect(part.className).not.toMatch(/text-right|-mr-|pl-\[/);
    }
  });

  it("sizes every part only by the width of its own area (cqw), with no screen-width unit, cap or breakpoint", () => {
    render(<InversionSection inversion={INVERSION} />);
    for (const part of [
      screen.getByText("First lead,"),
      screen.getByText(/then the/),
      screen.getByText("closing tail."),
    ]) {
      const sizes = part.className
        .split(/\s+/)
        .filter((token) => token.includes("text-[length:"));
      expect(sizes).toHaveLength(1);
      expect(sizes[0]).toMatch(/^text-\[length:[\d.]+cqw\]$/);
    }
  });

  it("makes its area a size container, centers the statements up to the lg breakpoint, and keeps it plain: no clipping, no pulling out, no padding", () => {
    const { container } = render(<InversionSection inversion={INVERSION} />);
    const area = container.querySelector("p.font-bold")
      ?.parentElement as HTMLElement;
    expect(area.className.split(/\s+/).sort()).toEqual(
      [
        "@container",
        "flex",
        "flex-col",
        "gap-10",
        "justify-center",
        "max-lg:text-center",
        "[text-rendering:geometricPrecision]",
      ].sort(),
    );
  });

  it("sizes the line of each statement like the main text, so the line height follows the text", () => {
    render(<InversionSection inversion={INVERSION} />);
    const main = screen.getByText(/then the/);
    for (const paragraph of statements()) {
      const tokens = paragraph.className.split(/\s+/);
      for (const token of main.className.split(/\s+/))
        expect(tokens).toContain(token);
    }
  });

  it("trims the blank of an opening bracket at the start of each statement so the lines start flush", () => {
    render(<InversionSection inversion={INVERSION} />);
    for (const paragraph of statements())
      expect(paragraph).toHaveClass("[text-spacing-trim:trim-start]");
  });

  it("draws the highlighted phrase as an inverted block", () => {
    render(<InversionSection inversion={INVERSION} />);
    const chip = screen.getByText("KEY");
    expect(chip).toHaveClass("bg-ink");
    expect(chip).toHaveClass("text-surface");
  });

  it("keeps the words around the highlighted phrase in the same sentence", () => {
    render(<InversionSection inversion={INVERSION} />);
    expect(screen.getByText("KEY").parentElement).toHaveTextContent(
      "then the KEY main",
    );
  });

  it("keeps the wide gap between its heading and the statements up to the lg breakpoint", () => {
    const { container } = render(<InversionSection inversion={INVERSION} />);
    const frame = container.querySelector("#inversion > div") as HTMLElement;
    expect(frame).toHaveClass("gap-12");
    expect(frame).not.toHaveClass("max-lg:gap-6");
  });

  it("draws the lead and the tail smaller than the main text, in the same size as each other", () => {
    render(<InversionSection inversion={INVERSION} />);
    const lead = screen.getByText("First lead,");
    const tail = screen.getByText("closing tail.");
    const main = screen.getByText(/then the/);
    expect(lead.className).toBe(tail.className);
    expect(lead.className).not.toBe(main.className);
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
