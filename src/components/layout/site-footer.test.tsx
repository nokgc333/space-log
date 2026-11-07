import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { site } from "@/lib/content";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
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
