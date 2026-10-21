import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { site } from "@/lib/content";

import { SiteHeader } from "./site-header";

function renderHeader(navBase?: string) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SiteHeader site={site} navBase={navBase} />
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

  it("shares the side padding of the sections from the md breakpoint: 16px below it, 48px from it", () => {
    renderHeader();
    const frame = screen
      .getAllByText(site.name)[0]
      .closest(".max-w-7xl") as HTMLElement;
    expect(frame).toHaveClass("px-4");
    expect(frame).toHaveClass("md:px-12");
  });

  it("shows the full nav from the lg breakpoint and the menu button below it", () => {
    const { container } = renderHeader();
    const nav = container.querySelector(
      "header nav[aria-label]",
    ) as HTMLElement;
    expect(nav).toHaveClass("hidden", "lg:block");
    expect(nav).not.toHaveClass("md:block");
    const menuWrapper = screen
      .getByRole("button", { name: site.menuLabel })
      .closest(".lg\\:hidden");
    expect(menuWrapper).not.toBeNull();
    expect(container.querySelector(".md\\:hidden")).toBeNull();
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

  describe("on a page other than the home page", () => {
    it("points every nav item at the section on the home page, in both menus", () => {
      renderHeader("/");
      for (const item of site.nav) {
        const links = screen.getAllByRole("link", {
          name: item.label,
          hidden: true,
        });
        expect(links).toHaveLength(2);
        for (const link of links) {
          expect(link).toHaveAttribute("href", `/${item.href}`);
        }
      }
    });

    it("keeps the skip link on the page itself and the logo on the home page", () => {
      renderHeader("/");
      const [first] = screen.getAllByRole("link");
      expect(first).toHaveAttribute("href", "#main");
      expect(screen.getByRole("link", { name: site.name })).toHaveAttribute(
        "href",
        "/",
      );
    });
  });
});
