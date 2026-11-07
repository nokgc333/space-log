"use client";

import { useState } from "react";

import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Tools } from "@/lib/content";

import { ToolRow, ToolsTableHead } from "./tool-row";

export function ToolsSection({ tools }: { tools: Tools }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { columns, toggleLabels, repoLinkLabel } = tools;

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
              {tools.entries.map((entry) => (
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
            </tbody>
          </table>
        </div>
      </div>
    </SectionFrame>
  );
}
