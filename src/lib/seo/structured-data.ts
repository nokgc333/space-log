type SiteInfo = { name: string; description: string; url: string };

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export function buildWebSiteJsonLd({ name, description, url }: SiteInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url,
    inLanguage: "ja",
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
}
