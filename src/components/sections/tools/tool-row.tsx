import { Fragment } from "react";

import { GitHubMark } from "@/components/ui/github-mark";
import type { Tool, Tools } from "@/lib/content";

const SUMMARY_CELL_CLASS = "h-10 line-clamp-2";
const TAGS_CELL_CLASS = "h-11 line-clamp-2 text-xs leading-[1.375rem]";
const FILLER_CELL_CLASS = "h-11";

type RowProps = {
  entry: Tool;
  isOpen: boolean;
  onToggle: () => void;
  repoLinkLabel: string;
  toggleLabels: Tools["toggleLabels"];
};

function RepoLink({ entry, label }: { entry: Tool; label: string }) {
  if (!entry.repoUrl) return null;
  return (
    <a
      href={entry.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label.replace("{name}", entry.name)}
      className="-m-2 flex size-9 items-center justify-center text-muted hover:text-ink"
    >
      <GitHubMark className="size-5" />
    </a>
  );
}

function TagList({ tags }: { tags: readonly string[] }) {
  return (
    <div className={TAGS_CELL_CLASS}>
      <ul role="list" className="inline">
        {tags.map((tag) => (
          <li
            key={tag}
            className="mr-1.5 inline-block rounded-sm border border-rule px-1.5 py-0.5 align-middle leading-none text-muted"
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToolRow({
  entry,
  isOpen,
  onToggle,
  repoLinkLabel,
  toggleLabels,
}: RowProps) {
  const detailId = `${entry.id}-detail`;
  return (
    <Fragment>
      <tr className="border-b border-rule align-top">
        <td className="py-3 align-middle">
          <RepoLink entry={entry} label={repoLinkLabel} />
        </td>
        <td className="py-3 pr-4 align-middle whitespace-nowrap">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={detailId}
            onClick={onToggle}
            className="text-left underline-offset-4 hover:underline"
          >
            {entry.name}{" "}
            <span className="sr-only">
              {isOpen ? toggleLabels.close : toggleLabels.open}
            </span>
          </button>
        </td>
        <td className="py-3 pr-4">
          <TagList tags={entry.tags} />
        </td>
        <td className="py-3 font-sans">
          <div className={SUMMARY_CELL_CLASS}>{entry.summary}</div>
        </td>
      </tr>
      {isOpen ? (
        <tr id={detailId} className="border-b border-rule">
          <td colSpan={2} />
          <td colSpan={2} className="py-3 font-sans">
            <p className="leading-relaxed">{entry.detail}</p>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function FillerRows({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <tr
      key={`filler-${index}`}
      aria-hidden="true"
      className="border-b border-transparent"
    >
      <td colSpan={4} className="py-3">
        <div className={FILLER_CELL_CLASS} />
      </td>
    </tr>
  ));
}

export function ToolsTableHead({ columns }: { columns: Tools["columns"] }) {
  return (
    <thead>
      <tr className="border-b border-ink text-left text-xs tracking-widest text-muted">
        <th scope="col" className="py-2 font-normal">
          <span className="sr-only">{columns.repo}</span>
        </th>
        <th scope="col" className="py-2 pr-4 font-normal">
          {columns.tool}
        </th>
        <th scope="col" className="py-2 pr-4 font-normal">
          {columns.tags}
        </th>
        <th scope="col" className="py-2 font-normal">
          {columns.summary}
        </th>
      </tr>
    </thead>
  );
}
