import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PrivacySection } from "@/lib/content";

import { PolicyDocument } from "./policy-document";

const SECTIONS: PrivacySection[] = [
  {
    heading: "第1. first",
    blocks: [
      { kind: "paragraph", text: "first paragraph" },
      {
        kind: "list",
        style: "bullet",
        items: [{ text: "bullet one" }, { text: "bullet two" }],
      },
    ],
  },
  {
    heading: "第2. second",
    blocks: [
      {
        kind: "list",
        style: "number",
        items: [
          {
            text: "step one",
            children: [
              { text: "step one a" },
              { text: "step one b", children: [{ text: "step one b i" }] },
            ],
          },
          { text: "step two" },
        ],
      },
      { kind: "paragraph", text: "last paragraph" },
    ],
  },
];

function renderDocument() {
  return render(<PolicyDocument lead="the lead" sections={SECTIONS} />);
}

describe("PolicyDocument", () => {
  it("starts with the lead", () => {
    const { container } = renderDocument();
    expect(container.firstElementChild?.tagName).toBe("P");
    expect(container.firstElementChild?.textContent).toBe("the lead");
  });

  it("has one level-2 heading per section, in order", () => {
    renderDocument();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["第1. first", "第2. second"]);
  });

  it("puts each section's blocks under its own heading, in the order written", () => {
    renderDocument();
    const second = screen
      .getByRole("heading", { name: "第2. second" })
      .closest("section") as HTMLElement;
    const kinds = Array.from(second.children)
      .slice(1)
      .map((child) => child.tagName);
    expect(kinds).toEqual(["OL", "P"]);
    expect(within(second).getByText("last paragraph")).toBeInTheDocument();
  });

  it("shows a paragraph as a paragraph", () => {
    renderDocument();
    expect(screen.getByText("first paragraph").tagName).toBe("P");
  });

  it("shows a bullet list as an unordered list with bullets", () => {
    const { container } = renderDocument();
    const list = container.querySelector("ul") as HTMLElement;
    expect(list.tagName).toBe("UL");
    expect(list).toHaveClass("list-disc");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((i) => i.textContent),
    ).toEqual(["bullet one", "bullet two"]);
  });

  it("shows a numbered list as an ordered list with numbers", () => {
    const { container } = renderDocument();
    const top = container.querySelector(
      "section:nth-of-type(2) > ol",
    ) as HTMLElement;
    expect(top.tagName).toBe("OL");
    expect(top).toHaveClass("list-decimal");
  });

  it("nests the children of a list item inside that item, as deep as written", () => {
    const { container } = renderDocument();
    const top = container.querySelector(
      "section:nth-of-type(2) > ol",
    ) as HTMLElement;
    const [stepOne] = Array.from(top.children);
    const nested = stepOne.querySelector(":scope > ol") as HTMLElement;
    expect(nested).toHaveClass("list-decimal");
    expect(
      Array.from(nested.children).map((i) => i.firstChild?.textContent),
    ).toEqual(["step one a", "step one b"]);
    expect(
      nested.querySelector(":scope > li:nth-child(2) > ol > li"),
    ).toHaveTextContent("step one b i");
  });

  it("gives a list without children no empty nested list", () => {
    const { container } = renderDocument();
    const stepTwo = container.querySelector(
      "section:nth-of-type(2) > ol > li:nth-child(2)",
    ) as HTMLElement;
    expect(stepTwo.querySelector("ol, ul")).toBeNull();
  });

  it("shows every text once", () => {
    renderDocument();
    for (const text of [
      "first paragraph",
      "bullet one",
      "bullet two",
      "step two",
      "last paragraph",
    ]) {
      expect(screen.getAllByText(text)).toHaveLength(1);
    }
  });

  describe("laid out like an article", () => {
    it("stacks everything in the normal flow, with no flex or grid box", () => {
      const { container } = renderDocument();
      expect(container.querySelector(".flex, .grid, .inline-flex")).toBeNull();
    });

    it("underlines each chapter heading", () => {
      renderDocument();
      for (const heading of screen.getAllByRole("heading", { level: 2 })) {
        expect(heading).toHaveClass("inline-block", "border-b-2");
      }
    });

    it("leaves room under the lead, each heading and each paragraph", () => {
      const { container } = renderDocument();
      expect(container.firstElementChild?.className).toMatch(/\bmb-/);
      for (const heading of screen.getAllByRole("heading", { level: 2 })) {
        expect(heading.className).toMatch(/\bmb-/);
      }
      expect(screen.getByText("first paragraph").className).toMatch(/\bmb-/);
    });
  });
});
