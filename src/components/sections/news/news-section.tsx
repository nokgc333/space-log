import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import type { News } from "@/lib/content";

export function NewsSection({ news }: { news: News }) {
  return (
    <SectionFrame id="news">
      <SectionHeading id="news-title" heading={news.heading} />
      <ol className="border-t border-rule font-mono text-sm">
        {news.entries.map((entry) => (
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
      </ol>
    </SectionFrame>
  );
}
