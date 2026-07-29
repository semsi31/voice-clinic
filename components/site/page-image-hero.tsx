"use client";

import { m } from "motion/react";
import { SiteBreadcrumb, type SiteBreadcrumbItem } from "@/components/site/site-breadcrumb";

const HERO_EASE = [0.22, 1, 0.36, 1] as const;

const HERO_BREADCRUMB_CLASSNAME =
  "text-white/70 [&_a]:text-white/70 [&_a:hover]:text-[#D4AF37] [&_span:last-child]:text-[#D4AF37]";

/**
 * Fixed header clearance:
 * mobile ≈ pt-3 + ~3.75rem bar → 5.75rem
 * sm+ / lg match header padding so copy never sits under the bar.
 */
export const PAGE_HERO_CONTENT_PT =
  "pt-[5.75rem] sm:pt-28 lg:pt-[7.5rem]";

export const PAGE_HERO_HEIGHT =
  "min-h-[340px] sm:min-h-[400px] lg:min-h-[480px]";

export type PageImageHeroProps = {
  breadcrumbs: SiteBreadcrumbItem[];
  eyebrow: string;
  title: string;
  imageSrc: string;
  imageClassName?: string;
  imageAlt?: string;
};

export function PageImageHero({
  breadcrumbs,
  eyebrow,
  title,
  imageSrc,
  imageClassName = "object-center",
  imageAlt,
}: PageImageHeroProps) {
  const resolvedAlt = imageAlt?.trim() || title;

  return (
    <section className={`relative isolate w-full overflow-hidden ${PAGE_HERO_HEIGHT}`}>
      <m.div
        className="absolute inset-0"
        initial={{ scale: 1.06, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: HERO_EASE }}
        style={{ opacity: 0.7, transform: "scale(1.06)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Full-bleed hero uses direct img for reliable object-cover crop. */}
        <img
          src={imageSrc}
          alt={resolvedAlt}
          width={1600}
          height={900}
          decoding="async"
          fetchPriority="high"
          sizes="100vw"
          className={`size-full object-cover ${imageClassName}`}
        />
      </m.div>

      <div
        className="absolute inset-0 bg-[#071225]/45"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#071225]/88 via-[#071225]/55 to-[#071225]/20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#071225]/50 via-transparent to-[#071225]/25"
        aria-hidden="true"
      />

      <div
        className={`relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12 ${PAGE_HERO_CONTENT_PT}`}
      >
        <m.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: HERO_EASE, delay: 0.1 }}
          style={{ opacity: 0, transform: "translateY(32px)" }}
        >
          <SiteBreadcrumb items={breadcrumbs} className={HERO_BREADCRUMB_CLASSNAME} />

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl break-words font-serif text-[1.625rem] font-bold leading-[1.2] tracking-tight text-white text-balance sm:text-3xl lg:text-4xl xl:text-[2.75rem]">
            {title}
          </h1>
        </m.div>
      </div>
    </section>
  );
}
