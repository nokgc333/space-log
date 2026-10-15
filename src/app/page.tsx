import { ContactShortcut } from "@/components/layout/contact-shortcut";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { site } from "@/lib/content";

export default function Home() {
  return (
    <>
      <SiteHeader site={site} />
      <main id="main" className="pt-14">
        <h1 className="px-4 py-4 font-mono">{site.name}</h1>
      </main>
      <SiteFooter site={site} year={new Date().getFullYear()} />
      <ContactShortcut label={site.contactShortcut} />
    </>
  );
}
