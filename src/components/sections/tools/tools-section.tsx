"use client";

import { Fragment, useState } from "react";

import { SectionFrame } from "@/components/ui/section-frame";
import { GitHubMark } from "@/components/ui/github-mark";
import { Pager } from "@/components/ui/pager";
import { SectionHeading } from "@/components/ui/section-heading";
import { usePagination } from "@/components/ui/use-pagination";
import type { Tools } from "@/lib/content";

export const TOOLS_PER_PAGE = 5;

const SUMMARY_CELL_CLASS = "h-10 line-clamp-2";
const TAGS_CELL_CLASS = "h-11 line-clamp-2 text-xs leading-[1.375rem]";
const FILLER_CELL_CLASS = "h-11";

export function ToolsSection({ tools }: { tools: Tools }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { columns, toggleLabels, pager, repoLinkLabel } = tools;
  const {
    page,
    pageCount,
    items: visible,
    fillerCount,
    goTo,
  } = usePagination(tools.entries, TOOLS_PER_PAGE);

  const changePage = (nextPage: number) => {
    goTo(nextPage);
    setOpenId(null);
  };

  return (
    <SectionFrame id="tools">
      <SectionHeading id="tools-title" heading={tools.heading} />
      <div className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl table-fixed border-collapse font-mono text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-36" />
              <col className="w-56" />
              <col />
            </colgroup>
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
            <tbody>
              {visible.map((entry) => {
                const isOpen = openId === entry.id;
                const detailId = `${entry.id}-detail`;
                return (
                  <Fragment key={entry.id}>
                    <tr className="border-b border-rule align-top">
                      <td className="py-3 align-middle">
                        {entry.repoUrl ? (
                          <a
                            href={entry.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={repoLinkLabel.replace(
                              "{name}",
                              entry.name,
                            )}
                            className="-m-2 flex size-9 items-center justify-center text-muted hover:text-ink"
                          >
                            <GitHubMark className="size-5" />
                          </a>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={detailId}
                          onClick={() => setOpenId(isOpen ? null : entry.id)}
                          className="text-left underline-offset-4 hover:underline"
                        >
                          {entry.name}{" "}
                          <span className="sr-only">
                            {isOpen ? toggleLabels.close : toggleLabels.open}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <div className={TAGS_CELL_CLASS}>
                          <ul role="list" className="inline">
                            {entry.tags.map((tag) => (
                              <li
                                key={tag}
                                className="mr-1.5 inline-block rounded-sm border border-rule px-1.5 py-0.5 align-middle leading-none text-muted"
                              >
                                {tag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="py-3 font-sans">
                        <div className={SUMMARY_CELL_CLASS}>
                          {entry.summary}
                        </div>
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
              })}
              {Array.from({ length: fillerCount }, (_, index) => (
                <tr
                  key={`filler-${index}`}
                  aria-hidden="true"
                  className="border-b border-transparent"
                >
                  <td colSpan={4} className="py-3">
                    <div className={FILLER_CELL_CLASS} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pager
          page={page}
          pageCount={pageCount}
          labels={pager}
          onChange={changePage}
        />
      </div>
    </SectionFrame>
  );
}
