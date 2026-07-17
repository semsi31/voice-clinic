"use client";

import { m } from "motion/react";
import { SiteBreadcrumb, type SiteBreadcrumbItem } from "@/components/site/site-breadcrumb";

const HERO_EASE = [0.22, 1, 0.36, 1] as const;

const HERO_BREADCRUMB_CLASSNAME =
  "text-white/70 [&_a]:text-white/70 [&_a:hover]:text-[#D4AF37] [&_span:last-child]:text-[#D4AF37]";

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
    <section className="px-4 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="relative h-[240px] overflow-hidden rounded-2xl sm:h-[300px] lg:h-[360px] lg:rounded-[1.75rem]">
          <m.div
            className="absolute inset-0"
            initial={{ scale: 1.06, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: HERO_EASE }}
            style={{ opacity: 0.7, transform: "scale(1.06)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Hero banner uses direct img for reliable object-cover crop. */}
            <img
              src={imageSrc}
              alt={resolvedAlt}
              width={1600}
              height={900}
              decoding="async"
              fetchPriority="high"
              sizes="(max-width: 1280px) 100vw, 1280px"
              className={`size-full object-cover ${imageClassName}`}
            />
          </m.div>

          <div
            className="absolute inset-0 bg-gradient-to-r from-[#071426]/90 via-[#071426]/65 to-[#071426]/15"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#071426]/35 via-transparent to-transparent"
            aria-hidden="true"
          />

          <m.div
            className="relative flex h-full flex-col justify-end p-5 sm:p-6 md:p-10 lg:p-12"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: HERO_EASE, delay: 0.1 }}
            style={{ opacity: 0, transform: "translateY(32px)" }}
          >
            <SiteBreadcrumb items={breadcrumbs} className={HERO_BREADCRUMB_CLASSNAME} />

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              {eyebrow}
            </p>
            <h1 className="mt-2 max-w-3xl font-serif text-[1.625rem] font-bold leading-[1.2] tracking-tight text-white text-balance sm:text-3xl lg:text-4xl xl:text-[2.75rem]">
              {title}
            </h1>
          </m.div>
        </div>
      </div>
    </section>
  );
}
