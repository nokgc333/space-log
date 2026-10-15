import Link from "next/link";

import { Mark } from "./mark";

type Props = { name: string };

export function Logo({ name }: Props) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-mono text-sm font-medium text-ink"
    >
      <Mark />
      <span>{name}</span>
    </Link>
  );
}
