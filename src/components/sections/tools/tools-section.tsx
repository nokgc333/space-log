"use client";

import { useState } from "react";

import { Pager } from "@/components/ui/pager";
import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import { usePagination } from "@/components/ui/use-pagination";
import type { Tools } from "@/lib/content";

import { FillerRows, ToolRow, ToolsTableHead } from "./tool-row";

export const TOOLS_PER_PAGE = 5;

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
            <ToolsTableHead columns={columns} />
            <tbody>
              {visible.map((entry) => (
                <ToolRow
                  key={entry.id}
                  entry={entry}
                  isOpen={openId === entry.id}
                  onToggle={() =>
                    setOpenId(openId === entry.id ? null : entry.id)
                  }
                  repoLinkLabel={repoLinkLabel}
                  toggleLabels={toggleLabels}
                />
              ))}
              <FillerRows count={fillerCount} />
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
