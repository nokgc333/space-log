import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Tools } from "@/lib/content";

import { TOOLS_PER_PAGE, ToolsSection } from "./tools-section";

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

  it("has exactly the columns repository, tool, tags and summary", () => {
    render(<ToolsSection tools={TOOLS} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "GITHUB",
      "TOOLS",
      "TAGS",
      "SUMMARY",
    ]);
    for (const header of headers) {
      expect(header).toHaveAttribute("scope", "col");
    }
  });

  it("names the icon column for screen readers only", () => {
    render(<ToolsSection tools={TOOLS} />);
    const header = screen.getByRole("columnheader", { name: "GITHUB" });
    expect(header.firstElementChild).toHaveClass("sr-only");
  });

  it("lists one row per tool with its name, tags and summary", () => {
    render(<ToolsSection tools={TOOLS} />);
    const row = screen.getByRole("row", { name: /alpha-tool/ });
    const list = within(row).getByRole("list");
    expect(list).toHaveAttribute("role", "list");
    const tags = within(list).getAllByRole("listitem");
    expect(tags.map((tag) => tag.textContent)).toEqual([
      "Python",
      "Click",
      "YAML",
    ]);
    expect(within(row).getByText("summary one")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /beta-tool/ })).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /beta-tool/ })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
  });

  it("centers the tool name vertically in its row", () => {
    render(<ToolsSection tools={TOOLS} />);
    const cell = screen
      .getByRole("button", { name: /alpha-tool/ })
      .closest("td");
    expect(cell).toHaveClass("align-middle");
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

  describe("paging", () => {
    const manyTools = (count: number): Tools => ({
      ...TOOLS,
      entries: Array.from({ length: count }, (_, index) => ({
        id: `tool-${index + 1}`,
        name: `tool-${index + 1}`,
        tags: ["Tag"],
        summary: `summary ${index + 1}`,
        detail: `detail ${index + 1}`,
      })),
    });
    const previous = () =>
      screen.getByRole("button", { name: "previous tools" });
    const next = () => screen.getByRole("button", { name: "next tools" });

    it("shows no pager when every tool fits on one page", () => {
      render(<ToolsSection tools={manyTools(TOOLS_PER_PAGE)} />);
      expect(screen.queryByRole("button", { name: "next tools" })).toBeNull();
      expect(
        screen.queryByRole("button", { name: "previous tools" }),
      ).toBeNull();
    });

    it("shows one page of tools and a pager when there are more", () => {
      render(<ToolsSection tools={manyTools(TOOLS_PER_PAGE + 1)} />);
      for (let index = 1; index <= TOOLS_PER_PAGE; index += 1) {
        expect(
          screen.getByRole("button", { name: new RegExp(`tool-${index} `) }),
        ).toBeInTheDocument();
      }
      expect(
        screen.queryByRole("button", {
          name: new RegExp(`tool-${TOOLS_PER_PAGE + 1} `),
        }),
      ).toBeNull();
      expect(screen.getByText(`1 / 2`)).toBeInTheDocument();
      expect(previous()).toBeDisabled();
      expect(next()).toBeEnabled();
    });

    it("moves to the next page and back", async () => {
      render(<ToolsSection tools={manyTools(TOOLS_PER_PAGE + 1)} />);
      await userEvent.click(next());
      expect(
        screen.getByRole("button", {
          name: new RegExp(`tool-${TOOLS_PER_PAGE + 1} `),
        }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /tool-1 / })).toBeNull();
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
      expect(next()).toBeDisabled();
      expect(previous()).toBeEnabled();

      await userEvent.click(previous());
      expect(
        screen.getByRole("button", { name: /tool-1 / }),
      ).toBeInTheDocument();
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("does not change the address when the page changes", async () => {
      render(<ToolsSection tools={manyTools(TOOLS_PER_PAGE + 1)} />);
      const before = window.location.href;
      await userEvent.click(next());
      expect(window.location.href).toBe(before);
    });

    it("closes an open detail when the page changes", async () => {
      render(<ToolsSection tools={manyTools(TOOLS_PER_PAGE + 1)} />);
      await userEvent.click(screen.getByRole("button", { name: /tool-1 / }));
      expect(screen.getByText("detail 1")).toBeInTheDocument();
      await userEvent.click(next());
      await userEvent.click(previous());
      expect(screen.getByRole("button", { name: /tool-1 / })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(screen.queryByText("detail 1")).toBeNull();
    });

    it("keeps the number of rows the same on every page with hidden filler rows", async () => {
      const { container } = render(
        <ToolsSection tools={manyTools(TOOLS_PER_PAGE + 1)} />,
      );
      const bodyRows = () => container.querySelectorAll("tbody tr");
      expect(bodyRows()).toHaveLength(TOOLS_PER_PAGE);
      await userEvent.click(next());
      expect(bodyRows()).toHaveLength(TOOLS_PER_PAGE);
      expect(screen.getAllByRole("row")).toHaveLength(2);
    });
  });

  describe("overflow", () => {
    it("cuts a long summary at two lines with an ellipsis", () => {
      render(<ToolsSection tools={TOOLS} />);
      expect(screen.getByText("summary one")).toHaveClass("line-clamp-2");
    });

    it("cuts the tags at two lines with an ellipsis", () => {
      render(<ToolsSection tools={TOOLS} />);
      const list = within(
        screen.getByRole("row", { name: /alpha-tool/ }),
      ).getByRole("list");
      expect(list.parentElement).toHaveClass("line-clamp-2");
    });

    it("shows the filler rows without a visible line", () => {
      const tools: Tools = {
        ...TOOLS,
        entries: Array.from({ length: TOOLS_PER_PAGE + 1 }, (_, index) => ({
          id: `tool-${index + 1}`,
          name: `tool-${index + 1}`,
          tags: ["Tag"],
          summary: `summary ${index + 1}`,
          detail: `detail ${index + 1}`,
        })),
      };
      const { container } = render(<ToolsSection tools={tools} />);
      fireEvent.click(screen.getByRole("button", { name: "next tools" }));
      const fillers = container.querySelectorAll("tbody tr[aria-hidden]");
      expect(fillers).toHaveLength(TOOLS_PER_PAGE - 1);
      const columnCount = screen.getAllByRole("columnheader").length;
      for (const filler of fillers) {
        expect(filler.querySelector("td")).toHaveAttribute(
          "colspan",
          String(columnCount),
        );
        expect(filler).toHaveClass("border-transparent");
        expect(filler).not.toHaveClass("border-rule");
      }
    });
  });

  describe("repository link", () => {
    const linkName = "alpha-tool on GitHub (opens in a new tab)";

    it("opens the repository in a new tab from the icon", () => {
      render(<ToolsSection tools={TOOLS} />);
      const link = screen.getByRole("link", { name: linkName });
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/example/alpha-tool",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("puts the icon in the first cell of the row, before the tool name", () => {
      render(<ToolsSection tools={TOOLS} />);
      const row = screen.getByRole("row", { name: /alpha-tool/ });
      const cells = row.querySelectorAll("td");
      expect(cells).toHaveLength(4);
      expect(cells[0]).toContainElement(
        screen.getByRole("link", { name: linkName }),
      );
      expect(cells[1]).toContainElement(
        screen.getByRole("button", { name: /alpha-tool/ }),
      );
    });

    it("centers the icon vertically in its row", () => {
      render(<ToolsSection tools={TOOLS} />);
      const cell = screen.getByRole("link", { name: linkName }).closest("td");
      expect(cell).toHaveClass("align-middle");
    });

    it("leaves the cell empty for a tool that has no repository yet", () => {
      render(<ToolsSection tools={TOOLS} />);
      const row = screen.getByRole("row", { name: /beta-tool/ });
      expect(within(row).queryByRole("link")).toBeNull();
      expect(row.querySelectorAll("td")).toHaveLength(4);
    });
  });
});
