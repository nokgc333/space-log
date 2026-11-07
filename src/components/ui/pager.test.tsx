import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pager } from "./pager";

const LABELS = { prev: "previous page", next: "next page" };

const setup = (page: number, pageCount: number) => {
  const onChange = vi.fn();
  render(
    <Pager
      page={page}
      pageCount={pageCount}
      labels={LABELS}
      onChange={onChange}
    />,
  );
  return {
    onChange,
    previous: () => screen.getByRole("button", { name: LABELS.prev }),
    next: () => screen.getByRole("button", { name: LABELS.next }),
  };
};

describe("Pager", () => {
  it("shows nothing when there is a single page", () => {
    const { container } = render(
      <Pager page={0} pageCount={1} labels={LABELS} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when there are no pages", () => {
    const { container } = render(
      <Pager page={0} pageCount={0} labels={LABELS} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and the page count, starting from one", () => {
    setup(1, 3);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("announces the page change politely", () => {
    setup(0, 3);
    expect(screen.getByText("1 / 3")).toHaveAttribute("aria-live", "polite");
  });

  it("cannot go back from the first page", () => {
    const { previous, next } = setup(0, 3);
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
  });

  it("cannot go forward from the last page", () => {
    const { previous, next } = setup(2, 3);
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();
  });

  it("asks for the next page when the next button is pressed", async () => {
    const { next, onChange } = setup(0, 3);
    await userEvent.click(next());
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("asks for the previous page when the previous button is pressed", async () => {
    const { previous, onChange } = setup(2, 3);
    await userEvent.click(previous());
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("can be used with the keyboard", async () => {
    const { next, onChange } = setup(0, 3);
    next().focus();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  });
});
