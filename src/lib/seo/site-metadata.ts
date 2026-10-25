import type { Metadata } from "next";

type SiteInfo = { name: string; description: string; url: string };
type PageInfo = { title: string; path: string };

const LOCALE = "ja_JP";
const TWITTER_CARD = "summary_large_image";

function share(site: SiteInfo, title: string, path: string) {
  return {
    openGraph: {
      type: "website" as const,
      siteName: site.name,
      title,
      description: site.description,
      url: path,
      locale: LOCALE,
    },
    twitter: {
      card: TWITTER_CARD,
      title,
      description: site.description,
    } as const,
  };
}

export function buildSiteMetadata(site: SiteInfo): Metadata {
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: `%s | ${site.name}` },
    description: site.description,
    alternates: { canonical: "/" },
    ...share(site, site.name, "/"),
  };
}

export function buildPageMetadata(
  site: SiteInfo,
  { title, path }: PageInfo,
): Metadata {
  return {
    title,
    alternates: { canonical: path },
    ...share(site, `${title} | ${site.name}`, path),
  };
}
