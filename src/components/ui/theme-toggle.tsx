"use client";

import { useTheme } from "next-themes";

import { useIsMounted } from "./use-is-mounted";

type Props = { labels: { toLight: string; toDark: string } };

export function ThemeToggle({ labels }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useIsMounted();
  const isDark = isMounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label={isDark ? labels.toLight : labels.toDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center border border-control font-mono text-xs text-ink hover:bg-ink hover:text-surface"
    >
      <span aria-hidden="true">{isDark ? "●" : "○"}</span>
    </button>
  );
}
