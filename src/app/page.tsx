import { ContactShortcut } from "@/components/layout/contact-shortcut";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroSection } from "@/components/sections/hero/hero-section";
import { InversionSection } from "@/components/sections/inversion/inversion-section";
import { NewsSection } from "@/components/sections/news/news-section";
import { PipelineSection } from "@/components/sections/pipeline/pipeline-section";
import { ToolsSection } from "@/components/sections/tools/tools-section";
import { hero, inversion, pipeline, site, tools } from "@/lib/content";
import { getNews } from "@/lib/news";

export default function Home() {
  return (
    <>
      <SiteHeader site={site} />
      <main id="main">
        <HeroSection hero={hero} />
        <InversionSection inversion={inversion} />
        <NewsSection news={getNews()} />
        <PipelineSection pipeline={pipeline} />
        <ToolsSection tools={tools} />
      </main>
      <SiteFooter site={site} year={new Date().getFullYear()} />
      <ContactShortcut label={site.contactShortcut} />
    </>
  );
}
