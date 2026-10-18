import type { ReactNode } from "react";

type Props = { id: string; children: ReactNode };

export function SectionFrame({ id, children }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-t border-rule"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 md:grid-cols-[calc((100%_-_3rem)/3)_1fr] md:gap-x-30">
        {children}
      </div>
    </section>
  );
}
