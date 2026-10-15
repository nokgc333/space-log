import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactShortcut } from "./contact-shortcut";

describe("ContactShortcut", () => {
  it("links to the contact section with the given label", () => {
    render(<ContactShortcut label="OPEN" />);
    expect(screen.getByRole("link", { name: "OPEN" })).toHaveAttribute(
      "href",
      "#contact",
    );
  });
});
