import type { ReactNode } from "react";

type Props = { id: string; children: ReactNode; roomyStack?: boolean };

export function SectionFrame({ id, children, roomyStack = false }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-t border-rule"
    >
      <div
        className={`mx-auto grid max-w-7xl gap-12 px-12 py-24 lg:grid-cols-[calc((100%_-_3rem)/3)_1fr] lg:gap-x-30 ${roomyStack ? "" : "max-lg:gap-6"}`}
      >
        {children}
      </div>
    </section>
  );
}
