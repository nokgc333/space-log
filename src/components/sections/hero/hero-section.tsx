"use client";

import { useRef } from "react";

import { LazyHeroScene } from "@/components/scene/lazy-hero-scene";
import { SectionHeading } from "@/components/ui/section-heading";
import { usePrefersReducedMotion } from "@/components/ui/use-prefers-reduced-motion";
import type { Hero } from "@/lib/content";

export function HeroSection({ hero }: { hero: Hero }) {
  const section = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section
      ref={section}
      id="hero"
      aria-labelledby="hero-title"
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      className="relative flex min-h-svh items-end overflow-hidden"
    >
      <LazyHeroScene
        label={hero.sceneLabel}
        fallbackText={hero.sceneFallback}
        eventSource={section}
      />
      <div className="pointer-events-none relative mx-auto w-full max-w-6xl px-4 pt-24 pb-16">
        <SectionHeading id="hero-title" heading={hero.heading} as="h1" />
      </div>
    </section>
  );
}
