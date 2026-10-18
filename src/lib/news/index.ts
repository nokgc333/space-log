import { news } from "@/lib/content";
import type { News } from "@/lib/content";

import { loadNewsEntries } from "./load-news-entries";

export function getNews(): News {
  return {
    ...news,
    entries: loadNewsEntries().slice(0, news.latestCount),
  };
}
