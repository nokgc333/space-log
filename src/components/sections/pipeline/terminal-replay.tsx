"use client";

import { type CSSProperties, useEffect, useId, useState } from "react";

import { usePrefersReducedMotion } from "@/components/ui/use-prefers-reduced-motion";

import { visibleLineCount } from "./visible-lines";

export const REPLAY_MS_PER_LINE = 320;

type Props = { lines: string[]; reservedLines: number; label: string };

export function TerminalReplay({ lines, reservedLines, label }: Props) {
  const captionId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [elapsedMs, setElapsedMs] = useState(0);
  const msPerLine = prefersReducedMotion ? 0 : REPLAY_MS_PER_LINE;
  const count = visibleLineCount(lines.length, elapsedMs, msPerLine);

  useEffect(() => {
    if (msPerLine === 0) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setElapsedMs(elapsed);
      if (visibleLineCount(lines.length, elapsed, msPerLine) >= lines.length) {
        window.clearInterval(timer);
      }
    }, msPerLine);
    return () => window.clearInterval(timer);
  }, [lines, msPerLine]);

  return (
    <figure className="border border-rule">
      <figcaption
        id={captionId}
        className="border-b border-rule px-3 py-2 font-mono text-xs tracking-widest text-muted"
      >
        {label}
      </figcaption>
      <pre
        role="log"
        aria-live="off"
        aria-labelledby={captionId}
        style={
          {
            "--reserved-lines": Math.max(reservedLines, lines.length),
          } as CSSProperties
        }
        className="h-[calc(var(--reserved-lines)*1lh+1.5rem)] overflow-x-auto p-3 font-mono text-xs leading-relaxed"
      >
        {lines.slice(0, count).join("\n")}
      </pre>
    </figure>
  );
}
