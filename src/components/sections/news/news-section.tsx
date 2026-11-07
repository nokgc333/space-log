"use client";

import { Pager } from "@/components/ui/pager";
import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import { usePagination } from "@/components/ui/use-pagination";
import type { News } from "@/lib/content";

const FILLER_ROW_CLASS = "border-b border-transparent py-3";
const FILLER_ROW_HEIGHT_CLASS = "h-5";

export function NewsSection({ news }: { news: News }) {
  const { page, pageCount, items, fillerCount, goTo } = usePagination(
    news.entries,
    news.perPage,
  );

  return (
    <SectionFrame id="news">
      <SectionHeading id="news-title" heading={news.heading} />
      <div className="min-w-0">
        <ol className="border-t border-rule font-mono text-sm">
          {items.map((entry) => (
            <li
              key={entry.id}
              className="grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1 border-b border-rule py-3"
            >
              <time dateTime={entry.date} className="text-muted tabular-nums">
                {entry.date}
              </time>
              <span className="text-signal">{news.kindLabels[entry.kind]}</span>
              <span className="font-sans">{entry.text}</span>
            </li>
          ))}
          {Array.from({ length: fillerCount }, (_, index) => (
            <li
              key={`filler-${index}`}
              aria-hidden="true"
              className={FILLER_ROW_CLASS}
            >
              <div className={FILLER_ROW_HEIGHT_CLASS} />
            </li>
          ))}
        </ol>
        <Pager
          page={page}
          pageCount={pageCount}
          labels={news.pager}
          onChange={goTo}
        />
      </div>
    </SectionFrame>
  );
}
