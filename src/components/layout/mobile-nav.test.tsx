import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileNav } from "./mobile-nav";

const NAV = [
  { label: "ONE", href: "#one" },
  { label: "TWO", href: "#two" },
];

function renderNav() {
  return render(<MobileNav label="menu" items={NAV} />);
}

describe("MobileNav", () => {
  it("starts closed: the button is collapsed and the links are hidden", () => {
    renderNav();
    expect(screen.getByRole("button", { name: "menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("link", { name: "ONE" })).toBeNull();
  });

  it("opens the links when the button is pressed", async () => {
    renderNav();
    await userEvent.click(screen.getByRole("button", { name: "menu" }));
    expect(screen.getByRole("button", { name: "menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "TWO" })).toHaveAttribute(
      "href",
      "#two",
    );
  });

  it("closes after a link is chosen", async () => {
    renderNav();
    await userEvent.click(screen.getByRole("button", { name: "menu" }));
    await userEvent.click(screen.getByRole("link", { name: "ONE" }));
    expect(screen.queryByRole("link", { name: "ONE" })).toBeNull();
  });

  it("closes on Escape and returns focus to the button", async () => {
    renderNav();
    const button = screen.getByRole("button", { name: "menu" });
    await userEvent.click(button);
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "ONE" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
