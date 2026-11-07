type Props = {
  page: number;
  pageCount: number;
  labels: { prev: string; next: string };
  onChange: (page: number) => void;
};

const BUTTON_CLASS = "px-2 py-1 enabled:hover:text-ink disabled:opacity-30";

export function Pager({ page, pageCount, labels, onChange }: Props) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-start gap-3 font-mono text-xs text-muted">
      <button
        type="button"
        aria-label={labels.prev}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className={BUTTON_CLASS}
      >
        ◀
      </button>
      <span aria-live="polite" className="tabular-nums">
        {`${page + 1} / ${pageCount}`}
      </span>
      <button
        type="button"
        aria-label={labels.next}
        disabled={page === pageCount - 1}
        onClick={() => onChange(page + 1)}
        className={BUTTON_CLASS}
      >
        ▶
      </button>
    </div>
  );
}
