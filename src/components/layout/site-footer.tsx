import Link from "next/link";

import type { Site } from "@/lib/content";
import { PRIVACY_PATH } from "@/lib/routes";

type Props = { site: Site; year: number };

export function SiteFooter({ site, year }: Props) {
  const { copyrightStartYear, note, privacyLabel } = site.footer;
  const years =
    year > copyrightStartYear ? `${copyrightStartYear}–${year}` : `${year}`;

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-4 text-center text-xs md:px-12 lg:flex-row lg:items-start lg:justify-between lg:text-left">
        <p>{`© ${years} ${site.name}`}</p>
        <p className="max-w-xl leading-relaxed text-muted">{note}</p>
        <div className="flex flex-col items-center gap-2 font-mono text-muted lg:items-end">
          <Link
            href={PRIVACY_PATH}
            className="text-ink underline underline-offset-4"
          >
            {privacyLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
