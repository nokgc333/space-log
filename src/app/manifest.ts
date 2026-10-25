import type { MetadataRoute } from "next";

import { site } from "@/lib/content";
import { BRAND_COLORS } from "@/lib/seo/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    lang: "ja",
    start_url: "/",
    display: "browser",
    background_color: BRAND_COLORS.dark.surface,
    theme_color: BRAND_COLORS.dark.surface,
  };
}
