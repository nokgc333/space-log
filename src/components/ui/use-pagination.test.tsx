import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePagination } from "./use-pagination";

const numbers = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1);

describe("usePagination", () => {
  it("starts on the first page", () => {
    const { result } = renderHook(() => usePagination(numbers(12), 5));
    expect(result.current.page).toBe(0);
    expect(result.current.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.pageCount).toBe(3);
  });

  it("moves to the page it is told to go to", () => {
    const { result } = renderHook(() => usePagination(numbers(12), 5));
    act(() => result.current.goTo(1));
    expect(result.current.page).toBe(1);
    expect(result.current.items).toEqual([6, 7, 8, 9, 10]);
  });

  it("does not move past the last page or before the first", () => {
    const { result } = renderHook(() => usePagination(numbers(12), 5));
    act(() => result.current.goTo(9));
    expect(result.current.page).toBe(2);
    act(() => result.current.goTo(-4));
    expect(result.current.page).toBe(0);
  });

  it("falls back to the last page when the list shrinks under the current page", () => {
    const { result, rerender } = renderHook(
      ({ list }) => usePagination(list, 5),
      { initialProps: { list: numbers(12) } },
    );
    act(() => result.current.goTo(2));
    rerender({ list: numbers(6) });
    expect(result.current.page).toBe(1);
    expect(result.current.items).toEqual([6]);
  });

  it("reports the filler places of the last page", () => {
    const { result } = renderHook(() => usePagination(numbers(6), 5));
    expect(result.current.fillerCount).toBe(0);
    act(() => result.current.goTo(1));
    expect(result.current.fillerCount).toBe(4);
  });

  it("does not remember a page request that was past the end once the list grows", () => {
    const { result, rerender } = renderHook(
      ({ list }) => usePagination(list, 5),
      { initialProps: { list: numbers(12) } },
    );
    act(() => result.current.goTo(9));
    expect(result.current.page).toBe(2);
    rerender({ list: numbers(30) });
    expect(result.current.page).toBe(2);
  });
});
