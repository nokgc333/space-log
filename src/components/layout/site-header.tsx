import type { Site } from "@/lib/content";

import { Logo } from "../ui/logo";
import { ThemeToggle } from "../ui/theme-toggle";
import { MobileNav } from "./mobile-nav";

type Props = { site: Site };

export function SiteHeader({ site }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-rule bg-surface">
      <a
        href="#main"
        className="sr-only bg-ink px-4 py-2 font-mono text-sm text-surface focus:not-sr-only focus:absolute focus:top-2 focus:left-4"
      >
        {site.skipLabel}
      </a>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Logo name={site.name} />
        <nav aria-label={site.menuLabel} className="hidden md:block">
          <ul className="flex items-center gap-6">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="font-mono text-xs tracking-widest text-muted hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle label={site.themeLabel} />
          <MobileNav label={site.menuLabel} items={site.nav} />
        </div>
      </div>
    </header>
  );
}
