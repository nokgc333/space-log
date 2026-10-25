import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactShortcut } from "./contact-shortcut";

describe("ContactShortcut", () => {
  it("is a link that jumps to the contact section, with the given label", () => {
    render(<ContactShortcut label="CONTACT" />);

    expect(screen.getByRole("link", { name: "CONTACT" })).toHaveAttribute(
      "href",
      "#contact",
    );
  });
});
