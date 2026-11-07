import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { privacy, site, type PrivacyListItem } from "@/lib/content";

import PrivacyPage, { metadata } from "./page";

function renderPage() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <PrivacyPage />
    </ThemeProvider>,
  );
}

describe("PrivacyPage", () => {
  it("has exactly one level-1 heading, the policy's title", () => {
    renderPage();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(privacy.title);
  });

  it("shows the lead and every section with its heading", () => {
    renderPage();
    expect(screen.getByText(privacy.lead)).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(privacy.sections.map((section) => section.heading));
  });

  it("shows every paragraph and list item of the policy", () => {
    renderPage();
    const texts = (items: readonly PrivacyListItem[]): string[] =>
      items.flatMap((item) => [item.text, ...texts(item.children ?? [])]);
    for (const section of privacy.sections) {
      for (const block of section.blocks) {
        const wanted =
          block.kind === "paragraph" ? [block.text] : texts(block.items);
        for (const text of wanted) {
          expect(screen.getAllByText(text).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("numbers every section heading as 第N.", () => {
    renderPage();
    privacy.sections.forEach((section, index) => {
      expect(section.heading.startsWith(`第${index + 1}. `)).toBe(true);
    });
  });

  it("states when the policy was last updated, as a date", () => {
    renderPage();
    const time = screen.getByText(privacy.updated);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", privacy.updated);
  });

  it("is one article named by its title, inside the main content", () => {
    renderPage();
    const article = screen.getByRole("article", { name: privacy.title });
    expect(screen.getByRole("main")).toContainElement(article);
  });

  it("is a single column: no grid or flex box around the title and the text", () => {
    renderPage();
    const article = screen.getByRole("article", { name: privacy.title });
    expect(article.querySelector(".grid, .flex, .inline-flex")).toBeNull();
    const main = screen.getByRole("main");
    expect(main.className).toMatch(/max-w-3xl/);
    expect(main.className).not.toMatch(/\b(grid|flex|inline-flex)\b/);
  });

  it("centers the title", () => {
    renderPage();
    const title = screen.getByRole("heading", { level: 1 });
    expect(title.parentElement).toHaveClass("text-center");
  });

  it("is the main content the skip link points at", () => {
    renderPage();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("links back to the top", () => {
    renderPage();
    expect(
      screen.getByRole("link", { name: privacy.backLabel }),
    ).toHaveAttribute("href", "/");
  });

  it("has the header and the footer, with the header's nav pointing at the home page", () => {
    renderPage();
    const [banner] = screen.getAllByRole("banner");
    for (const item of site.nav) {
      for (const link of within(banner).getAllByRole("link", {
        name: item.label,
      })) {
        expect(link).toHaveAttribute("href", `/${item.href}`);
      }
    }
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("names the page after the policy, leaving the site name to the title template", () => {
    expect(metadata.title).toBe(privacy.title);
  });

  it("declares its own canonical path and a link preview titled with the site name", () => {
    expect(metadata.alternates?.canonical).toBe("/privacy");
    expect(metadata.openGraph?.title).toBe(`${privacy.title} | ${site.name}`);
  });
});
