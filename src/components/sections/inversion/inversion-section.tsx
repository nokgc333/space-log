import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Inversion } from "@/lib/content";

export function InversionSection({ inversion }: { inversion: Inversion }) {
  return (
    <SectionFrame id="inversion">
      <SectionHeading id="inversion-title" heading={inversion.heading} />
      <div className="flex flex-col justify-center gap-6">
        {inversion.body.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </SectionFrame>
  );
}
