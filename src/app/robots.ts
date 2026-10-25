import type { MetadataRoute } from "next";

import { site } from "@/lib/content";
import { isIndexable } from "@/lib/seo/indexing";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable(process.env)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
