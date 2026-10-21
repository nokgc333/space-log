"use client";

import { useState } from "react";

import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Pipeline } from "@/lib/content";

import { TerminalReplay } from "./terminal-replay";

export function PipelineSection({ pipeline }: { pipeline: Pipeline }) {
  const [selectedId, setSelectedId] = useState(pipeline.stages[0].id);
  const selected =
    pipeline.stages.find((stage) => stage.id === selectedId) ??
    pipeline.stages[0];
  const reservedLines = Math.max(
    ...pipeline.stages.map((stage) => stage.terminal.length),
  );

  return (
    <SectionFrame id="pipeline">
      <SectionHeading id="pipeline-title" heading={pipeline.heading} />
      <div className="flex min-w-0 flex-col gap-7">
        <div className="@container pb-2">
          <ol className="grid auto-cols-fr grid-flow-col gap-x-[1em] text-[length:min(1rem,calc((100cqw-10px)/39.2))] [text-rendering:geometricPrecision] md:gap-x-[1.5em] md:text-[length:min(1rem,calc((100cqw-10px)/41.2))]">
            {pipeline.stages.map((stage) => (
              <li
                key={stage.id}
                className="relative not-first:before:absolute not-first:before:top-1/2 not-first:before:right-full not-first:before:h-px not-first:before:w-[1em] not-first:before:bg-rule md:not-first:before:w-[1.5em]"
              >
                <button
                  type="button"
                  aria-pressed={stage.id === selected.id}
                  onClick={() => setSelectedId(stage.id)}
                  className="flex h-full w-full flex-col items-start gap-[0.25em] border border-ink px-[0.75em] py-[0.75em] text-left aria-pressed:bg-ink aria-pressed:text-surface"
                >
                  <span className="font-display text-[1em] leading-[1.5] font-bold tracking-wide whitespace-nowrap">
                    {stage.stage}
                  </span>
                  <span className="font-mono text-[0.75em] leading-[1.3333] whitespace-nowrap">
                    {stage.tool}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid">
          {pipeline.stages.map((stage) => {
            const isSelected = stage.id === selected.id;
            return (
              <div
                key={stage.id}
                aria-hidden={!isSelected}
                className={`col-start-1 row-start-1 flex flex-col gap-3 ${isSelected ? "" : "invisible"}`}
              >
                <p className="font-mono text-xs tracking-widest text-signal">
                  {stage.tool}
                </p>
                <h3 className="text-lg font-bold">{stage.role}</h3>
                <p className="leading-relaxed">{stage.detail}</p>
              </div>
            );
          })}
        </div>

        <TerminalReplay
          key={selected.id}
          lines={selected.terminal}
          reservedLines={reservedLines}
          label={pipeline.replayLabel}
        />
      </div>
    </SectionFrame>
  );
}
