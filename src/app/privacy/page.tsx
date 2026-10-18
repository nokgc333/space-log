import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PolicyDocument } from "@/components/privacy/policy-document";
import { privacy, site } from "@/lib/content";

export const metadata: Metadata = {
  title: `${privacy.title} | ${site.name}`,
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader site={site} navBase="/" />
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pt-32 pb-24">
        <article aria-labelledby="privacy-title">
          <header className="mb-12 text-center">
            <h1
              id="privacy-title"
              className="font-display text-3xl font-bold tracking-tight text-ink"
            >
              {privacy.title}
            </h1>
            <p className="mt-3 font-mono text-xs text-muted">
              <time dateTime={privacy.updated}>{privacy.updated}</time>
            </p>
          </header>
          <PolicyDocument lead={privacy.lead} sections={privacy.sections} />
          <Link
            href="/"
            className="inline-block font-mono text-xs tracking-widest underline underline-offset-4"
          >
            {privacy.backLabel}
          </Link>
        </article>
      </main>
      <SiteFooter site={site} year={new Date().getFullYear()} />
    </>
  );
}
