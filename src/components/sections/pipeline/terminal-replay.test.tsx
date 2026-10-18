import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REPLAY_MS_PER_LINE, TerminalReplay } from "./terminal-replay";

const LINES = ["$ run job", "step one", "step two", "done"];
const originalMatchMedia = window.matchMedia;

function stubReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function shownText() {
  return screen.getByRole("log").textContent;
}

beforeEach(() => {
  vi.useFakeTimers();
  stubReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
});

describe("TerminalReplay", () => {
  it("shows only the first line at first", () => {
    render(
      <TerminalReplay lines={LINES} reservedLines={LINES.length} label="log" />,
    );
    expect(shownText()).toBe("$ run job");
  });

  it("adds one line per interval", () => {
    render(
      <TerminalReplay lines={LINES} reservedLines={LINES.length} label="log" />,
    );
    act(() => {
      vi.advanceTimersByTime(REPLAY_MS_PER_LINE * 2);
    });
    expect(shownText()).toBe("$ run job\nstep one\nstep two");
  });

  it("shows every line and stops its timer when the output is complete", () => {
    render(
      <TerminalReplay lines={LINES} reservedLines={LINES.length} label="log" />,
    );
    act(() => {
      vi.advanceTimersByTime(REPLAY_MS_PER_LINE * 10);
    });
    expect(shownText()).toBe(LINES.join("\n"));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("shows every line at once, without a timer, when the user asks for less motion", () => {
    stubReducedMotion(true);
    render(
      <TerminalReplay lines={LINES} reservedLines={LINES.length} label="log" />,
    );
    expect(shownText()).toBe(LINES.join("\n"));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears its timer when it is removed", () => {
    const { unmount } = render(
      <TerminalReplay lines={LINES} reservedLines={LINES.length} label="log" />,
    );
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("names the output with the given label", () => {
    render(
      <TerminalReplay
        lines={LINES}
        reservedLines={LINES.length}
        label="Execution log"
      />,
    );
    expect(
      screen.getByRole("log", { name: "Execution log" }),
    ).toBeInTheDocument();
  });

  it("keeps the height of the full output from the first line on", () => {
    render(
      <TerminalReplay lines={LINES} reservedLines={LINES.length} label="log" />,
    );
    expect(
      screen.getByRole("log").style.getPropertyValue("--reserved-lines"),
    ).toBe("4");
  });

  it("reserves more lines than its own when a longer output exists elsewhere", () => {
    render(<TerminalReplay lines={LINES} reservedLines={7} label="log" />);
    expect(
      screen.getByRole("log").style.getPropertyValue("--reserved-lines"),
    ).toBe("7");
  });

  it("never reserves fewer lines than the output has", () => {
    render(<TerminalReplay lines={LINES} reservedLines={2} label="log" />);
    expect(
      screen.getByRole("log").style.getPropertyValue("--reserved-lines"),
    ).toBe("4");
  });
});
