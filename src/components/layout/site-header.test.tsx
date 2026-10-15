import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { site } from "@/lib/content";

import { SiteHeader } from "./site-header";

function renderHeader() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SiteHeader site={site} />
    </ThemeProvider>,
  );
}

describe("SiteHeader", () => {
  it("offers a skip link to the main content as the first link", () => {
    renderHeader();
    const [first] = screen.getAllByRole("link");
    expect(first).toHaveTextContent(site.skipLabel);
    expect(first).toHaveAttribute("href", "#main");
  });

  it("shows the site name and links to every nav item", () => {
    renderHeader();
    expect(screen.getByText(site.name)).toBeInTheDocument();
    for (const item of site.nav) {
      expect(
        screen.getAllByRole("link", { name: item.label })[0],
      ).toHaveAttribute("href", item.href);
    }
  });

  it("has the theme toggle", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: site.themeLabel }),
    ).toBeInTheDocument();
  });
});
