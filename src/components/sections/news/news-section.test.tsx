import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { News } from "@/lib/content";

import { NewsSection } from "./news-section";

const NEWS: News = {
  heading: { label: "02 / NEWS", title: "NEWS", subtitle: "お知らせ" },
  kindLabels: { added: "ADDED", updated: "UPDATED", fixed: "FIXED" },
  perPage: 5,
  pager: { prev: "previous news", next: "next news" },
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

describe("NewsSection paging", () => {
  const entriesOf = (count: number): News["entries"] =>
    Array.from({ length: count }, (_, index) => ({
      id: `item-${index + 1}`,
      date: "2026-03-01",
      kind: "added" as const,
      text: `Item ${index + 1}`,
    }));
  const pagedNews = (count: number): News => ({
    ...NEWS,
    entries: entriesOf(count),
  });
  const previous = () => screen.getByRole("button", { name: NEWS.pager.prev });
  const next = () => screen.getByRole("button", { name: NEWS.pager.next });
  const texts = () =>
    screen.getAllByRole("listitem").map((item) => item.textContent ?? "");

  it("shows no pager when every entry fits on one page", () => {
    render(<NewsSection news={pagedNews(NEWS.perPage)} />);
    expect(screen.queryByRole("button", { name: NEWS.pager.next })).toBeNull();
    expect(screen.queryByRole("button", { name: NEWS.pager.prev })).toBeNull();
  });

  it("shows one page of entries and a pager when there are more", () => {
    render(<NewsSection news={pagedNews(NEWS.perPage + 1)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(NEWS.perPage);
    expect(texts()[0]).toContain("Item 1");
    expect(screen.queryByText("Item 6")).toBeNull();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
  });

  it("moves to the next page and back", async () => {
    render(<NewsSection news={pagedNews(NEWS.perPage + 1)} />);
    await userEvent.click(next());
    expect(texts()).toEqual([expect.stringContaining("Item 6")]);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();

    await userEvent.click(previous());
    expect(texts()[0]).toContain("Item 1");
    expect(screen.getAllByRole("listitem")).toHaveLength(NEWS.perPage);
  });

  it("keeps the entries in the order they are given on every page", async () => {
    render(<NewsSection news={pagedNews(NEWS.perPage * 2)} />);
    await userEvent.click(next());
    texts().forEach((text, index) =>
      expect(text).toContain(`Item ${NEWS.perPage + index + 1}`),
    );
  });

  it("can be paged with the keyboard", async () => {
    render(<NewsSection news={pagedNews(NEWS.perPage + 1)} />);
    next().focus();
    await userEvent.keyboard("{Enter}");
    expect(texts()).toEqual([expect.stringContaining("Item 6")]);
  });

  it("fills the empty places of the last page with hidden rows", async () => {
    render(<NewsSection news={pagedNews(NEWS.perPage + 1)} />);
    const fillers = () => document.querySelectorAll('li[aria-hidden="true"]');
    expect(fillers()).toHaveLength(0);
    await userEvent.click(next());
    expect(fillers()).toHaveLength(NEWS.perPage - 1);
  });

  it("adds no hidden rows when everything fits on one page", () => {
    render(<NewsSection news={pagedNews(2)} />);
    expect(document.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(0);
  });

  it("uses the page size given by the content", () => {
    render(<NewsSection news={{ ...pagedNews(3), perPage: 2 }} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });
});
