import type { MetadataRoute } from "next";

import { site } from "@/lib/content";
import { PRIVACY_PATH } from "@/lib/routes";

const PATHS = ["/", PRIVACY_PATH];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: new URL(path, site.url).toString() }));
}
