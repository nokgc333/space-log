"use client";

import { useTheme } from "next-themes";

import { Mark } from "./mark";
import { useIsMounted } from "./use-is-mounted";

type Props = { label: string };

export function ThemeToggle({ label }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useIsMounted();
  const isDark = isMounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center border border-control text-ink hover:bg-ink hover:text-surface"
    >
      <Mark isFilled={isDark} />
    </button>
  );
}
