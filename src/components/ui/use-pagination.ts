"use client";

import { useState } from "react";

import { clampPage, pageCount, paginate } from "@/lib/pagination/paginate";

export function usePagination<T>(items: readonly T[], perPage: number) {
  const [requestedPage, setRequestedPage] = useState(0);
  const page = clampPage(requestedPage, pageCount(items.length, perPage));
  const current = paginate(items, page, perPage);

  const goTo = (nextPage: number) => {
    setRequestedPage(clampPage(nextPage, current.pageCount));
  };

  return { page, goTo, ...current };
}
