import type { SectionHeadingContent } from "@/lib/content";

type Props = {
  id: string;
  heading: SectionHeadingContent;
  as?: "h1" | "h2";
  enlargeOnSmall?: boolean;
};

const LABEL_CLASS = "font-mono text-xs tracking-widest text-signal";
const LABEL_ENLARGED = "max-lg:text-[length:min(1.125rem,9.8cqw)]";
const TITLE_CLASS =
  "mt-3 font-display text-4xl font-bold tracking-tight whitespace-pre-line text-ink uppercase md:text-5xl";
const TITLE_ENLARGED =
  "max-md:text-[length:min(3.375rem,15.6cqw)] md:max-lg:text-[length:min(4.5rem,15.6cqw)]";
const SUBTITLE_CLASS = "mt-2 font-mono text-sm text-muted";
const SUBTITLE_ENLARGED = "max-lg:text-[length:1.3125rem]";

function join(...classes: (string | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function SectionHeading({
  id,
  heading,
  as: Title = "h2",
  enlargeOnSmall = false,
}: Props) {
  return (
    <header
      className={join(
        "mb-10 max-w-3xl max-lg:mx-auto max-lg:text-center",
        enlargeOnSmall && "@container",
      )}
    >
      <p className={join(LABEL_CLASS, enlargeOnSmall && LABEL_ENLARGED)}>
        {heading.label}
      </p>
      <Title
        id={id}
        className={join(TITLE_CLASS, enlargeOnSmall && TITLE_ENLARGED)}
      >
        {heading.title}
      </Title>
      <p className={join(SUBTITLE_CLASS, enlargeOnSmall && SUBTITLE_ENLARGED)}>
        {heading.subtitle}
      </p>
      {heading.lead ? (
        <p className="mt-6 leading-relaxed text-balance [word-break:auto-phrase] whitespace-pre-line text-ink">
          {heading.lead}
        </p>
      ) : null}
    </header>
  );
}
