import { SectionHeading } from "@/components/ui/section-heading";
import type { Inversion } from "@/lib/content";

export function InversionSection({ inversion }: { inversion: Inversion }) {
  return (
    <section
      id="inversion"
      aria-labelledby="inversion-title"
      className="border-t border-rule"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2">
        <SectionHeading id="inversion-title" heading={inversion.heading} />
        <div className="flex flex-col justify-center gap-6">
          {inversion.body.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
