import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/layout/theme-provider";

import { bodyFont, displayFont, monoFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "space-log",
  description: "this is space-log website.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
