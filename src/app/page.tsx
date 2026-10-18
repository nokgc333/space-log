import { ContactShortcut } from "@/components/layout/contact-shortcut";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroSection } from "@/components/sections/hero/hero-section";
import { InversionSection } from "@/components/sections/inversion/inversion-section";
import { NewsSection } from "@/components/sections/news/news-section";
import { hero, inversion, site } from "@/lib/content";
import { getNews } from "@/lib/news";

export default function Home() {
  return (
    <>
      <SiteHeader site={site} />
      <main id="main">
        <HeroSection hero={hero} />
        <InversionSection inversion={inversion} />
        <NewsSection news={getNews()} />
      </main>
      <SiteFooter site={site} year={new Date().getFullYear()} />
      <ContactShortcut label={site.contactShortcut} />
    </>
  );
}
