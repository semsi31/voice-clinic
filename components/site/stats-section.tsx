"use client";

import { useEffect, useRef, useState } from "react";
import { CountUpValue } from "@/components/site/count-up-value";
import { Reveal } from "@/components/site/motion/reveal";
import { IconBadge, type SiteIconName } from "@/components/site/site-icon";
import { COUNT_UP_STAGGER_MS, getGridCardDelay } from "@/lib/site-motion";

type StatItem = {
  end: number;
  suffix?: string;
  label: string;
  icon: SiteIconName;
};

type StatsSectionProps = {
  stats: StatItem[];
};

export function StatsSection({ stats }: StatsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    let isActive = true;
    let startTimer = 0;
    let observer: IntersectionObserver | null = null;

    const begin = () => {
      if (isActive) {
        setStarted(true);
      }
    };

    const cleanup = () => {
      isActive = false;
      window.clearTimeout(startTimer);
      observer?.disconnect();
      observer = null;
    };

    if (!("IntersectionObserver" in window)) {
      begin();
      return cleanup;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          begin();
          observer?.disconnect();
          observer = null;
        }
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(section);

    const rect = section.getBoundingClientRect();
    const isAlreadyVisible =
      rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15;

    if (isAlreadyVisible) {
      startTimer = window.setTimeout(begin, 400);
    }

    return cleanup;
  }, []);

  return (
    <section
      id="site-stats"
      ref={sectionRef}
      className="bg-[#faf8f3] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-0">
        {stats.map((stat, index) => (
          <Reveal
            key={stat.label}
            asChild
            variant="fade-up-card"
            delay={getGridCardDelay(index)}
          >
            <div className="flex flex-col items-center gap-2.5 text-center">
              <IconBadge
                name={stat.icon}
                variant="light"
                size="sm"
                className="size-11 rounded-xl border-[#D4AF37]/45 bg-[#071225] text-[#D4AF37] shadow-md shadow-[#071225]/15 sm:size-12"
              />
              <div>
                <p className="font-serif text-2xl font-bold tabular-nums tracking-tight text-primary sm:text-3xl lg:text-4xl">
                  <CountUpValue
                    active={started}
                    end={stat.end}
                    suffix={stat.suffix}
                    delayMs={index * COUNT_UP_STAGGER_MS}
                  />
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
