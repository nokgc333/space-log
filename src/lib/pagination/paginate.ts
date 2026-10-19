export type Page<T> = {
  items: T[];
  pageCount: number;
  fillerCount: number;
};

function assertPerPage(perPage: number): void {
  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new RangeError(
      `perPage must be a positive whole number, got ${perPage}`,
    );
  }
}

export function pageCount(total: number, perPage: number): number {
  assertPerPage(perPage);
  return Math.ceil(total / perPage);
}

export function clampPage(page: number, count: number): number {
  return Math.min(Math.max(page, 0), Math.max(count - 1, 0));
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  perPage: number,
): Page<T> {
  const count = pageCount(items.length, perPage);
  const current = clampPage(page, count);
  const visible = items.slice(current * perPage, (current + 1) * perPage);
  const fillerCount = count > 1 ? perPage - visible.length : 0;
  return { items: visible, pageCount: count, fillerCount };
}
