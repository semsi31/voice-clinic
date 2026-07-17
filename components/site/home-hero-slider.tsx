"use client";

import Link from "next/link";
import { Reveal } from "@/components/site/motion/reveal";
import { heroDelays, IMAGE_REVEAL_DURATION_MS } from "@/lib/site-motion";
import { SiteIcon } from "@/components/site/site-icon";

const heroBackgroundImage =
  "linear-gradient(90deg, rgba(7,18,37,0.78) 0%, rgba(7,18,37,0.68) 34%, rgba(7,18,37,0.35) 64%, rgba(7,18,37,0.06) 100%), linear-gradient(180deg, rgba(7,18,37,0.10) 0%, rgba(7,18,37,0.04) 52%, rgba(7,18,37,0.22) 100%), url('/images/hero-hearing-care..jpg'), linear-gradient(110deg, #071225 0%, #102A43 48%, #d8c09c 100%)";

export function HomeHeroSlider() {
  return (
    <section className="relative min-h-[560px] overflow-x-clip bg-[#071225] px-4 pb-16 pt-0 text-white sm:px-6 sm:pb-20 md:min-h-[620px] lg:min-h-[680px] lg:overflow-hidden lg:px-8 lg:py-20 lg:pt-24">
      <Reveal
        variant="fade-image"
        delay={heroDelays.image}
        duration={IMAGE_REVEAL_DURATION_MS}
        animateOnLoad
        className="pointer-events-none absolute inset-0"
      >
        {/* Decorative LCP background; CSS layers preserved for existing visual treatment. */}
        <div
          className="size-full bg-cover bg-center lg:bg-[position:center_right]"
          style={{ backgroundImage: heroBackgroundImage }}
          role="img"
          aria-label="Voice Klinik İşitme Merkezi"
        />
      </Reveal>

      <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center pt-24 sm:pt-28 md:min-h-[500px] lg:min-h-[540px] lg:pt-0">
        <div className="w-full max-w-[760px]">
          <Reveal variant="fade-up-compact" delay={heroDelays.eyebrow} animateOnLoad>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#D4AF37]">
              Voice İşitme Merkezi
            </p>
          </Reveal>
          <Reveal variant="fade-up-hero-title" delay={heroDelays.title} animateOnLoad>
            <h1 className="mt-4 max-w-[720px] break-words font-serif text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Daha Net Duyun,
              <span className="block text-[#B88A28]">Hayata Daha Yakın Olun.</span>
            </h1>
          </Reveal>
          <Reveal variant="fade-up-hero" delay={heroDelays.description} animateOnLoad>
            <p className="mt-5 max-w-[590px] text-sm leading-7 text-white/86 sm:text-base">
              Voice İşitme Merkezi olarak, modern teknoloji ve uzman kadromuzla
              işitme sağlığınızı önemsiyor, yaşam kalitenizi artıracak çözümler
              sunuyoruz.
            </p>
          </Reveal>

          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
            <Reveal
              variant="fade-up-hero"
              delay={heroDelays.cta}
              animateOnLoad
              className="w-full sm:w-auto"
            >
              <Link
                href="/iletisim#randevu-talebi"
                className="site-btn-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C49A3A] px-6 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-[#B88A28] sm:w-auto sm:min-w-[11rem] sm:rounded-md"
              >
                <SiteIcon name="calendar" className="size-4" />
                Randevu Al
              </Link>
            </Reveal>
            <Reveal
              variant="fade-up-hero"
              delay={heroDelays.cta + 70}
              animateOnLoad
              className="w-full sm:w-auto"
            >
              <Link
                href="/hizmetlerimiz"
                className="site-btn-motion site-btn-outline-on-dark site-link-arrow-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-bold text-white shadow-sm backdrop-blur-md sm:w-auto sm:min-w-[11rem] sm:rounded-md"
              >
                Hizmetlerimiz
                <SiteIcon name="arrow-right" className="site-link-arrow size-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
