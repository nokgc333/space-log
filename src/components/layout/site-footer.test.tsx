import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { site } from "@/lib/content";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("shares the side padding of the sections from the md breakpoint: 16px below it, 48px from it", () => {
    render(<SiteFooter site={site} year={site.footer.copyrightStartYear} />);
    const frame = screen
      .getByText(site.footer.note)
      .closest(".max-w-7xl") as HTMLElement;
    expect(frame).toHaveClass("px-4");
    expect(frame).toHaveClass("md:px-12");
  });

  it("lines its parts up in a row from the lg breakpoint, and stacks them below it", () => {
    render(<SiteFooter site={site} year={site.footer.copyrightStartYear} />);
    const frame = screen
      .getByText(site.footer.note)
      .closest(".max-w-7xl") as HTMLElement;
    expect(frame).toHaveClass(
      "lg:flex-row",
      "lg:items-start",
      "lg:justify-between",
    );
    expect(frame.className).not.toMatch(
      /md:(flex-row|items-start|justify-between)/,
    );
    const links = screen.getByRole("link", { name: site.footer.privacyLabel });
    expect(links.parentElement).toHaveClass("lg:items-end");
    expect(links.parentElement?.className).not.toMatch(/md:items-end/);
  });

  it("centers each part up to the lg breakpoint and aligns them to the edges from it", () => {
    render(<SiteFooter site={site} year={site.footer.copyrightStartYear} />);
    const frame = screen
      .getByText(site.footer.note)
      .closest(".max-w-7xl") as HTMLElement;
    expect(frame).toHaveClass(
      "flex-col",
      "items-center",
      "text-center",
      "lg:items-start",
      "lg:text-left",
    );
    const links = screen.getByRole("link", { name: site.footer.privacyLabel });
    expect(links.parentElement).toHaveClass("items-center", "lg:items-end");
  });

  it("sets one text size for the whole footer in its frame, and no part sets its own", () => {
    render(<SiteFooter site={site} year={site.footer.copyrightStartYear} />);
    const frame = screen
      .getByText(site.footer.note)
      .closest(".max-w-7xl") as HTMLElement;
    expect(frame).toHaveClass("text-xs");
    expect(frame.children.length).toBeGreaterThanOrEqual(3);
    for (const part of [...frame.children])
      expect(part.className).not.toMatch(
        /(^|\s)text-(xs|sm|base|lg|xl|2xl|3xl)(\s|$)/,
      );
  });

  it("links to the privacy policy", () => {
    render(<SiteFooter site={site} year={site.footer.copyrightStartYear} />);
    expect(
      screen.getByRole("link", { name: site.footer.privacyLabel }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("shows the notice from content", () => {
    render(<SiteFooter site={site} year={site.footer.copyrightStartYear} />);
    expect(screen.getByText(site.footer.note)).toBeInTheDocument();
  });

  it("shows a single year in the first year", () => {
    const start = site.footer.copyrightStartYear;
    render(<SiteFooter site={site} year={start} />);
    expect(screen.getByText(`© ${start} ${site.name}`)).toBeInTheDocument();
  });

  it("shows a year range afterwards", () => {
    const start = site.footer.copyrightStartYear;
    render(<SiteFooter site={site} year={start + 2} />);
    expect(
      screen.getByText(`© ${start}–${start + 2} ${site.name}`),
    ).toBeInTheDocument();
  });
});
