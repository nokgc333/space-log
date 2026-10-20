import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConsentText } from "./consent-text";

const props = {
  linkText: "privacy policy",
  href: "/p",
  describedBy: "note-id",
};

describe("ConsentText", () => {
  it("makes the link text a link to the given address", () => {
    render(
      <ConsentText
        text="I agree to the privacy policy"
        {...props}
        href="/privacy"
      />,
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("keeps the words around the link in reading order", () => {
    const { container } = render(
      <ConsentText text="I agree to the privacy policy, thanks" {...props} />,
    );
    expect(container.textContent).toBe("I agree to the privacy policy, thanks");
  });

  it("works when the text starts with the link text", () => {
    const { container } = render(
      <ConsentText text="privacy policy accepted" {...props} />,
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toBeInTheDocument();
    expect(container.textContent).toBe("privacy policy accepted");
  });

  it("opens the link in a new tab without leaking the opener or the referrer", () => {
    render(<ConsentText text="the privacy policy" {...props} />);
    const link = screen.getByRole("link", { name: "privacy policy" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("points the link at the element that describes it", () => {
    render(
      <ConsentText
        text="the privacy policy"
        {...props}
        describedBy="the-note"
      />,
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("aria-describedby", "the-note");
  });

  it("is drawn blue and underlined by the link color and underline classes", () => {
    render(<ConsentText text="the privacy policy" {...props} />);
    const link = screen.getByRole("link", { name: "privacy policy" });
    expect(link).toHaveClass("text-link");
    expect(link).toHaveClass("underline");
  });

  it("shows the plain text when it does not contain the link text", () => {
    const { container } = render(<ConsentText text="I agree" {...props} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.textContent).toBe("I agree");
  });
});
