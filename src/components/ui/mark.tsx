type Props = { isFilled?: boolean; className?: string };

export function Mark({ isFilled = false, className = "size-5" }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      {isFilled ? (
        <path
          fillRule="evenodd"
          d="M1 1h18v18H1z M13 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
        />
      ) : (
        <>
          <rect
            x="1.5"
            y="1.5"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
          />
          <circle cx="13" cy="7" r="2.5" />
        </>
      )}
    </svg>
  );
}
