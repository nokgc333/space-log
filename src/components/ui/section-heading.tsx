import type { SectionHeadingContent } from "@/lib/content";

type Props = {
  id: string;
  heading: SectionHeadingContent;
  as?: "h1" | "h2";
};

export function SectionHeading({ id, heading, as: Title = "h2" }: Props) {
  return (
    <header className="mb-10 max-w-3xl">
      <p className="font-mono text-xs tracking-widest text-signal">
        {heading.label}
      </p>
      <Title
        id={id}
        className="mt-3 font-display text-4xl font-bold tracking-tight text-ink uppercase md:text-5xl"
      >
        {heading.title}
      </Title>
      <p className="mt-2 font-mono text-sm text-muted">{heading.subtitle}</p>
      {heading.lead ? (
        <p className="mt-6 leading-relaxed text-balance [word-break:auto-phrase] whitespace-pre-line text-ink">
          {heading.lead}
        </p>
      ) : null}
    </header>
  );
}
