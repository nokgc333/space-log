import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Inversion } from "@/lib/content";
import { splitAround } from "@/lib/text/split-around";

type Statement = Inversion["body"][number];

const SMALL_CLASS = "text-[length:3.6cqw] leading-[1.5]";
const MAIN_CLASS = "text-[length:4.6cqw] leading-[1.45]";
const CHIP_CLASS = "mx-[0.04em] bg-ink px-[0.22em] text-surface";

function Main({ text, highlight }: { text: string; highlight?: string }) {
  const parts = highlight ? splitAround(text, highlight) : null;
  if (!parts) return <>{text}</>;

  const [before, after] = parts;
  return (
    <>
      {before}
      <span className={CHIP_CLASS}>{highlight}</span>
      {after}
    </>
  );
}

function StatementRow({ statement }: { statement: Statement }) {
  return (
    <p
      className={`font-sans font-bold tracking-[-0.01em] text-ink [text-spacing-trim:trim-start] ${MAIN_CLASS}`}
    >
      {statement.lead ? (
        <span className={SMALL_CLASS}>{statement.lead}</span>
      ) : null}
      <span className={MAIN_CLASS}>
        <Main text={statement.main} highlight={statement.highlight} />
      </span>
      {statement.tail ? (
        <span className={SMALL_CLASS}>{statement.tail}</span>
      ) : null}
    </p>
  );
}

export function InversionSection({ inversion }: { inversion: Inversion }) {
  return (
    <SectionFrame id="inversion" roomyStack>
      <SectionHeading id="inversion-title" heading={inversion.heading} />
      <div className="@container flex flex-col justify-center gap-10 [text-rendering:geometricPrecision] max-lg:text-center">
        {inversion.body.map((statement) => (
          <StatementRow key={statement.main} statement={statement} />
        ))}
      </div>
    </SectionFrame>
  );
}
