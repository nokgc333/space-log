import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "./theme-provider";

afterEach(() => {
  document.documentElement.className = "";
  localStorage.clear();
});

describe("ThemeProvider", () => {
  it("shows its children", () => {
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );

    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("starts in the light theme whatever the system prefers, marking it with a class on the page", () => {
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("light");
  });

  it("restores the dark theme the visitor chose before", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("dark");
  });
});
