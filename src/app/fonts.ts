import {
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  IBM_Plex_Sans_JP,
} from "next/font/google";

export const displayFont = IBM_Plex_Sans_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-plex-condensed",
  display: "swap",
});

export const monoFont = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const bodyFont = IBM_Plex_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-plex-jp",
  display: "swap",
  preload: false,
});
