import Link from "next/link";

import { splitAround } from "@/lib/text/split-around";

type Props = {
  text: string;
  linkText: string;
  href: string;
  describedBy: string;
};

export function ConsentText({ text, linkText, href, describedBy }: Props) {
  const parts = splitAround(text, linkText);
  if (!parts) return <>{text}</>;

  const [before, after] = parts;
  return (
    <>
      {before}
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={describedBy}
        className="text-link underline underline-offset-2 hover:decoration-2"
      >
        {linkText}
      </Link>
      {after}
    </>
  );
}
