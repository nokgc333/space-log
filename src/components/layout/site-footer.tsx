import Link from "next/link";

import type { Site } from "@/lib/content";

type Props = { site: Site; year: number };

export function SiteFooter({ site, year }: Props) {
  const { copyrightStartYear, note, privacyLabel } = site.footer;
  const years =
    year > copyrightStartYear ? `${copyrightStartYear}–${year}` : `${year}`;

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 md:flex-row md:items-start md:justify-between">
        <p>{`© ${years} ${site.name}`}</p>
        <p className="max-w-xl text-sm leading-relaxed text-muted">{note}</p>
        <div className="flex flex-col gap-2 font-mono text-xs text-muted md:items-end">
          <Link
            href="/privacy"
            className="text-ink underline underline-offset-4"
          >
            {privacyLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
