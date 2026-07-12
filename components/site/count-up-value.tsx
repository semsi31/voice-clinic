"use client";

import { useEffect, useRef, useState } from "react";
import {
  COUNT_UP_START_DELAY_MS,
  getCountUpDuration,
} from "@/lib/site-motion";

type CountUpValueProps = {
  active: boolean;
  end: number;
  suffix?: string;
  durationMs?: number;
  delayMs?: number;
  className?: string;
};

type CountPhase = "idle" | "running" | "done";

export function CountUpValue({
  active,
  end,
  suffix = "",
  durationMs,
  delayMs = 0,
  className,
}: CountUpValueProps) {
  const hasAnimatedRef = useRef(false);
  const [value, setValue] = useState(0);
  const [phase, setPhase] = useState<CountPhase>("idle");

  useEffect(() => {
    if (!active || hasAnimatedRef.current) {
      return;
    }

    let isActive = true;
    let startTimer = 0;
    let tickFrame = 0;

    const cleanup = () => {
      isActive = false;
      window.clearTimeout(startTimer);
      cancelAnimationFrame(tickFrame);
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const resolvedDuration =
      durationMs ?? getCountUpDuration(end, { reducedMotion: prefersReducedMotion });

    hasAnimatedRef.current = true;
    setValue(0);
    setPhase("running");

    startTimer = window.setTimeout(() => {
      const startTime = performance.now();

      const tick = (currentTime: number) => {
        if (!isActive) {
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / resolvedDuration, 1);

        setValue(Math.round(end * progress));

        if (progress < 1) {
          tickFrame = requestAnimationFrame(tick);
          return;
        }

        setValue(end);
        setPhase("done");
      };

      tickFrame = requestAnimationFrame(tick);
    }, COUNT_UP_START_DELAY_MS + delayMs);

    return cleanup;
  }, [active, delayMs, durationMs, end]);

  return (
    <span
      className={["site-count-up", className].filter(Boolean).join(" ")}
      data-phase={phase}
      aria-live="off"
    >
      {value}
      {suffix}
    </span>
  );
}
