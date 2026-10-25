import { ImageResponse } from "next/og";

import { hero, site } from "@/lib/content";
import { BRAND_COLORS } from "@/lib/seo/brand-colors";

export const alt = `${site.name}: ${hero.heading.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { surface, ink, signal } = BRAND_COLORS.dark;

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: surface,
        color: ink,
      }}
    >
      <div style={{ fontSize: 40, color: signal, letterSpacing: "0.12em" }}>
        {site.name.toUpperCase()}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 120,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          whiteSpace: "pre-line",
        }}
      >
        {hero.heading.title}
      </div>
    </div>,
    size,
  );
}
