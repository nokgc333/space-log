type Props = { label: string };

export function ContactShortcut({ label }: Props) {
  return (
    <a
      href="#contact"
      className="fixed right-4 bottom-4 z-30 border border-ink bg-surface px-4 py-3 font-mono text-xs tracking-widest text-ink hover:bg-ink hover:text-surface"
    >
      {label}
    </a>
  );
}
