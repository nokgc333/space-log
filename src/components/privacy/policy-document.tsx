import type { PrivacyListItem, PrivacySection } from "@/lib/content";

type ListStyle = "number" | "bullet";

function PolicyList({
  items,
  style,
  isNested = false,
}: {
  items: readonly PrivacyListItem[];
  style: ListStyle;
  isNested?: boolean;
}) {
  const Tag = style === "number" ? "ol" : "ul";
  const marker = style === "number" ? "list-decimal" : "list-disc";
  const gap = isNested ? "mt-2" : "mb-5 last:mb-0";
  return (
    <Tag className={`${marker} ${gap} pl-6 leading-relaxed`}>
      {items.map((item) => (
        <li key={item.text} className="mt-2 first:mt-0">
          {item.text}
          {item.children ? (
            <PolicyList items={item.children} style={style} isNested />
          ) : null}
        </li>
      ))}
    </Tag>
  );
}

type Props = { lead: string; sections: readonly PrivacySection[] };

export function PolicyDocument({ lead, sections }: Props) {
  return (
    <>
      <p className="mb-12 leading-relaxed">{lead}</p>
      {sections.map((section) => (
        <section key={section.heading} className="mb-12">
          <h2 className="mb-5 inline-block border-b-2 border-ink pb-1 text-xl font-bold">
            {section.heading}
          </h2>
          {section.blocks.map((block, index) =>
            block.kind === "paragraph" ? (
              <p key={index} className="mb-5 leading-relaxed last:mb-0">
                {block.text}
              </p>
            ) : (
              <PolicyList key={index} items={block.items} style={block.style} />
            ),
          )}
        </section>
      ))}
    </>
  );
}
