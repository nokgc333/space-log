import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { News } from "@/lib/content";

import { NewsSection } from "./news-section";

const NEWS: News = {
  heading: { label: "02 / NEWS", title: "NEWS", subtitle: "お知らせ" },
  kindLabels: { added: "ADDED", updated: "UPDATED", fixed: "FIXED" },
  latestCount: 5,
  entries: [
    { id: "b", date: "2026-03-01", kind: "added", text: "Newer item" },
    { id: "a", date: "2026-01-02", kind: "fixed", text: "Older item" },
  ],
};

describe("NewsSection", () => {
  it("lists every entry with a machine-readable date", () => {
    render(<NewsSection news={NEWS} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(NEWS.entries.length);
    for (const entry of NEWS.entries) {
      expect(
        document.querySelector(`time[datetime="${entry.date}"]`),
      ).not.toBeNull();
    }
  });

  it("shows the kind label of each entry", () => {
    render(<NewsSection news={NEWS} />);
    expect(screen.getByText("ADDED")).toBeInTheDocument();
    expect(screen.getByText("FIXED")).toBeInTheDocument();
  });

  it("shows the entries in the order it is given", () => {
    render(<NewsSection news={NEWS} />);
    const texts = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");
    expect(texts[0]).toContain("Newer item");
    expect(texts[1]).toContain("Older item");
  });

  it("is named by its own heading, and the nav link can reach it", () => {
    render(<NewsSection news={NEWS} />);
    const section = screen.getByRole("region", { name: "NEWS" });
    expect(section).toHaveAttribute("id", "news");
  });
});
