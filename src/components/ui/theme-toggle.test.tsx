import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "./theme-toggle";

const LABELS = { toLight: "to light", toDark: "to dark" };

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeToggle labels={LABELS} />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("starts in light mode and offers the dark theme", () => {
    renderToggle();
    const button = screen.getByRole("button", { name: LABELS.toDark });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("switches the document to the dark theme when pressed", async () => {
    renderToggle();
    await userEvent.click(screen.getByRole("button", { name: LABELS.toDark }));
    expect(document.documentElement).toHaveClass("dark");
    expect(
      screen.getByRole("button", { name: LABELS.toLight }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
