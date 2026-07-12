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
      className="bg-white px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-10"
    >
      <div className="mx-auto grid max-w-6xl gap-3 rounded-[1.5rem] border border-[#eadfca] bg-white p-3 shadow-xl shadow-slate-950/5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Reveal
            key={stat.label}
            asChild
            variant="fade-up-card"
            delay={getGridCardDelay(index)}
          >
              <div className="flex items-center justify-center gap-3 rounded-2xl p-2.5 sm:justify-start">
                <IconBadge
                  name={stat.icon}
                  variant="light"
                  size="sm"
                  className="size-10 rounded-xl border-[#D4AF37]/45 bg-[#071225] text-[#D4AF37] shadow-md shadow-[#071225]/15"
                />
                <div>
                  <p className="min-w-[5rem] text-xl font-bold tabular-nums text-primary">
                    <CountUpValue
                      active={started}
                      end={stat.end}
                      suffix={stat.suffix}
                      delayMs={index * COUNT_UP_STAGGER_MS}
                    />
                  </p>
                  <p className="text-xs font-semibold text-slate-600">{stat.label}</p>
                </div>
              </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
