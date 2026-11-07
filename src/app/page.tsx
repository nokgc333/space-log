import { ContactShortcut } from "@/components/layout/contact-shortcut";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroSection } from "@/components/sections/hero/hero-section";
import { hero, site } from "@/lib/content";

export default function Home() {
  return (
    <>
      <SiteHeader site={site} />
      <main id="main">
        <HeroSection hero={hero} />
      </main>
      <SiteFooter site={site} year={new Date().getFullYear()} />
      <ContactShortcut label={site.contactShortcut} />
    </>
  );
}
