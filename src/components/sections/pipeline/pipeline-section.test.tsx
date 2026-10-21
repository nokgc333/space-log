import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Pipeline } from "@/lib/content";

import { PipelineSection } from "./pipeline-section";
import { REPLAY_MS_PER_LINE } from "./terminal-replay";

const PIPELINE: Pipeline = {
  heading: {
    label: "03 / PIPELINE",
    title: "FROM A TO B",
    subtitle: "sub",
    lead: "lead",
  },
  replayLabel: "Execution log",
  stages: [
    {
      id: "first",
      stage: "FIRST",
      tool: "tool-one",
      role: "role one",
      detail: "detail one",
      terminal: ["$ tool-one", "first-only-line", "first-later-line"],
    },
    {
      id: "second",
      stage: "SECOND",
      tool: "tool-two",
      role: "role two",
      detail: "detail two",
      terminal: [
        "$ tool-two",
        "second-only-line",
        "second-middle-line",
        "second-later-line",
      ],
    },
  ],
};

afterEach(() => {
  vi.useRealTimers();
});

describe("PipelineSection", () => {
  it("is a region named by its heading", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    expect(screen.getByRole("region", { name: "FROM A TO B" })).toHaveAttribute(
      "id",
      "pipeline",
    );
  });

  it("shrinks the row of stage buttons to fit its container instead of scrolling sideways", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const list = screen.getAllByRole("list")[0];
    const container = list.parentElement as HTMLElement;
    expect(container).toHaveClass("@container");
    expect(container.className).not.toMatch(/overflow-x/);
    expect(list.className).not.toMatch(/min-w-max/);
    expect(list.className).toMatch(/cqw/);
  });

  it("sizes the stage buttons in em so they shrink with the row", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const [first] = screen.getAllByRole("button", { name: /first|FIRST/i });
    expect(first.className).toMatch(/px-\[0\.75em\]/);
    expect(first.className).not.toMatch(/(^|\s)px-3(\s|$)/);
  });

  it("keeps the stage name above the tool at every screen size", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const [first] = screen.getAllByRole("button", { name: /first/i });
    const tokens = first.className.split(/\s+/);
    expect(tokens).toContain("flex-col");
    expect(tokens.filter((token) => /flex-row/.test(token))).toEqual([]);
  });

  it("never wraps the stage name or the tool, and sets its text without rounding the width of each letter", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const list = screen.getAllByRole("list")[0];
    expect(list.className).toContain("[text-rendering:geometricPrecision]");
    const [first] = screen.getAllByRole("button", { name: /first/i });
    for (const part of [...first.children])
      expect(part).toHaveClass("whitespace-nowrap");
  });

  it("selects the first stage at first", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    expect(screen.getByRole("button", { name: /FIRST/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /SECOND/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "role one" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "role two" }),
    ).not.toBeInTheDocument();
  });

  it("shows another stage's detail when it is chosen by keyboard", async () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const second = screen.getByRole("button", { name: /SECOND/ });
    second.focus();
    await userEvent.keyboard("{Enter}");
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /FIRST/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "role two" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "role one" }),
    ).not.toBeInTheDocument();
  });

  it("names the tool of each stage on its button", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    expect(
      screen.getByRole("button", { name: /tool-one/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tool-two/ }),
    ).toBeInTheDocument();
  });

  it("restarts the replay from the first line when another stage is chosen", () => {
    vi.useFakeTimers();
    render(<PipelineSection pipeline={PIPELINE} />);
    act(() => {
      vi.advanceTimersByTime(REPLAY_MS_PER_LINE * 10);
    });
    expect(screen.getByRole("log")).toHaveTextContent("first-later-line");

    fireEvent.click(screen.getByRole("button", { name: /SECOND/ }));
    const log = screen.getByRole("log", { name: "Execution log" });
    expect(log.textContent).toBe("$ tool-two");
  });

  it("keeps the replay box the same height for every stage (that of the longest output)", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const reserved = () =>
      screen.getByRole("log").style.getPropertyValue("--reserved-lines");
    expect(reserved()).toBe("4");
    fireEvent.click(screen.getByRole("button", { name: /SECOND/ }));
    expect(reserved()).toBe("4");
    fireEvent.click(screen.getByRole("button", { name: /FIRST/ }));
    expect(reserved()).toBe("4");
  });

  it("keeps every stage's description in the same place, hidden unless chosen, so the height does not change", () => {
    render(<PipelineSection pipeline={PIPELINE} />);
    const descriptionOf = (text: string) =>
      screen.getByText(text).parentElement;
    expect(descriptionOf("detail one")).toHaveAttribute("aria-hidden", "false");
    expect(descriptionOf("detail two")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: /SECOND/ }));
    expect(descriptionOf("detail one")).toHaveAttribute("aria-hidden", "true");
    expect(descriptionOf("detail two")).toHaveAttribute("aria-hidden", "false");
  });
});
