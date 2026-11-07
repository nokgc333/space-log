import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Tools } from "@/lib/content";

import { ToolsSection } from "./tools-section";

const TOOLS: Tools = {
  heading: {
    label: "04 / TOOLS",
    title: "TOOLS",
    subtitle: "sub",
    lead: "lead",
  },
  columns: { repo: "GITHUB", tool: "TOOLS", tags: "TAGS", summary: "SUMMARY" },
  toggleLabels: { open: "open detail", close: "close detail" },
  repoLinkLabel: "{name} on GitHub (opens in a new tab)",
  pager: { prev: "previous tools", next: "next tools" },
  entries: [
    {
      id: "alpha-tool",
      name: "alpha-tool",
      repoUrl: "https://github.com/example/alpha-tool",
      tags: ["Python", "Click", "YAML"],
      summary: "summary one",
      detail: "detail one",
    },
    {
      id: "beta-tool",
      name: "beta-tool",
      tags: ["Rust"],
      summary: "summary two",
      detail: "detail two",
    },
  ],
};

describe("ToolsSection", () => {
  it("is a region named by its heading", () => {
    render(<ToolsSection tools={TOOLS} />);
    expect(screen.getByRole("region", { name: "TOOLS" })).toHaveAttribute(
      "id",
      "tools",
    );
  });

  it("keeps every detail closed at first", () => {
    render(<ToolsSection tools={TOOLS} />);
    for (const toggle of screen.getAllByRole("button")) {
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
    expect(screen.queryByText("detail one")).not.toBeInTheDocument();
    expect(screen.queryByText("detail two")).not.toBeInTheDocument();
  });

  it("opens a tool's detail, then closes it", async () => {
    render(<ToolsSection tools={TOOLS} />);
    const toggle = screen.getByRole("button", { name: /alpha-tool/ });
    expect(toggle).toHaveAccessibleName("alpha-tool open detail");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("alpha-tool close detail");
    expect(screen.getByText("detail one")).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("detail one")).not.toBeInTheDocument();
  });

  it("opens one detail at a time", async () => {
    render(<ToolsSection tools={TOOLS} />);
    await userEvent.click(screen.getByRole("button", { name: /alpha-tool/ }));
    await userEvent.click(screen.getByRole("button", { name: /beta-tool/ }));
    expect(screen.getByText("detail two")).toBeInTheDocument();
    expect(screen.queryByText("detail one")).not.toBeInTheDocument();
  });

  it("points each toggle at the detail it controls", async () => {
    render(<ToolsSection tools={TOOLS} />);
    const toggle = screen.getByRole("button", { name: /alpha-tool/ });
    await userEvent.click(toggle);
    const detailId = toggle.getAttribute("aria-controls");
    expect(detailId).toBeTruthy();
    expect(document.getElementById(detailId as string)).toHaveTextContent(
      "detail one",
    );
  });
});
