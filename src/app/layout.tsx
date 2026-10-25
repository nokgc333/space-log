import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/lib/content";
import { BRAND_COLORS } from "@/lib/seo/brand-colors";
import { buildSiteMetadata } from "@/lib/seo/site-metadata";
import { buildWebSiteJsonLd } from "@/lib/seo/structured-data";

import { bodyFont, displayFont, monoFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = buildSiteMetadata(site);

export const viewport: Viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: BRAND_COLORS.light.surface,
    },
    { media: "(prefers-color-scheme: dark)", color: BRAND_COLORS.dark.surface },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable}`}
    >
      <body className="antialiased">
        <JsonLd data={buildWebSiteJsonLd(site)} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
