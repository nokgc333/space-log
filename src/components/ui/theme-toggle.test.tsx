import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "./theme-toggle";

const LABEL = "dark mode";

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeToggle label={LABEL} />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("starts in light mode with the toggle not pressed", () => {
    renderToggle();
    const button = screen.getByRole("button", { name: LABEL });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("switches the document to the dark theme when pressed", async () => {
    renderToggle();
    await userEvent.click(screen.getByRole("button", { name: LABEL }));
    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button", { name: LABEL })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches back to light when pressed twice", async () => {
    renderToggle();
    const button = screen.getByRole("button", { name: LABEL });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
