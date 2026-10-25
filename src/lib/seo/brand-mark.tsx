import { BRAND_COLORS } from "./brand-colors";

const { surface, ink, signal } = BRAND_COLORS.dark;

export function BrandMark({ pixels }: { pixels: number }) {
  return (
    <div
      style={{
        width: pixels,
        height: pixels,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: surface,
      }}
    >
      <svg
        width={pixels * 0.7}
        height={pixels * 0.7}
        viewBox="0 0 20 20"
        fill="none"
      >
        <rect
          x="1.5"
          y="1.5"
          width="17"
          height="17"
          stroke={ink}
          strokeWidth="1.5"
        />
        <circle cx="13" cy="7" r="2.5" fill={signal} />
      </svg>
    </div>
  );
}
