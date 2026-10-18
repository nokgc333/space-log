import type { NewsEntry } from "@/lib/content";

export function sortNewestFirst(entries: readonly NewsEntry[]): NewsEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}
