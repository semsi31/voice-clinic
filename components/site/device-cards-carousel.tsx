"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DeviceCarouselItem = {
  title: string;
  description: string;
  image: string;
  imageSrc: string | null;
};

type DeviceCardsCarouselProps = {
  items: DeviceCarouselItem[];
};

const SWIPE_THRESHOLD = 48;
const TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

export function DeviceCardsCarousel({ items }: DeviceCardsCarouselProps) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const lastIndex = items.length - 1;
  const canPrev = active > 0;
  const canNext = active < lastIndex;

  const goTo = useCallback(
    (index: number) => {
      setActive(Math.max(0, Math.min(lastIndex, index)));
    },
    [lastIndex],
  );

  const go = useCallback(
    (direction: -1 | 1) => {
      goTo(active + direction);
    },
    [active, goTo],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        go(-1);
      }
      if (event.key === "ArrowRight") {
        go(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  const onPointerDown = (clientX: number) => {
    touchStartX.current = clientX;
    dragDelta.current = 0;
  };

  const onPointerMove = (clientX: number) => {
    if (touchStartX.current == null) {
      return;
    }
    dragDelta.current = clientX - touchStartX.current;
  };

  const onPointerUp = () => {
    if (touchStartX.current == null) {
      return;
    }

    if (dragDelta.current <= -SWIPE_THRESHOLD) {
      go(1);
    } else if (dragDelta.current >= SWIPE_THRESHOLD) {
      go(-1);
    }

    touchStartX.current = null;
    dragDelta.current = 0;
  };

  return (
    <div className="relative flex items-center gap-2 sm:gap-3 lg:gap-4">
      <button
        type="button"
        aria-label="Önceki kart"
        disabled={!canPrev}
        onClick={() => go(-1)}
        className={cn(
          "z-20 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#071225] shadow-md transition sm:size-11",
          "hover:border-[#D4AF37]/55 hover:text-[#B88A28]",
          "disabled:pointer-events-none disabled:opacity-30",
        )}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      <div
        className="relative h-[400px] w-full min-w-0 select-none touch-pan-y overflow-hidden sm:h-[440px] lg:h-[480px]"
        onTouchStart={(event) => onPointerDown(event.touches[0]?.clientX ?? 0)}
        onTouchMove={(event) => onPointerMove(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={onPointerUp}
        onMouseDown={(event) => onPointerDown(event.clientX)}
        onMouseMove={(event) => {
          if (touchStartX.current != null) {
            onPointerMove(event.clientX);
          }
        }}
        onMouseUp={onPointerUp}
        onMouseLeave={() => {
          if (touchStartX.current != null) {
            onPointerUp();
          }
        }}
      >
        {items.map((device, index) => {
          const offset = index - active;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;
          const isPreview = absOffset === 1;
          const isVisible = absOffset <= 1;

          return (
            <m.article
              key={device.title}
              className={cn(
                "absolute top-1/2 left-1/2 flex w-[78%] max-w-[24rem] origin-center flex-col overflow-hidden rounded-[1.75rem] border bg-white sm:w-[62%] sm:max-w-[28rem] lg:w-[52%] lg:max-w-[30rem]",
                isActive
                  ? "border-[#D4AF37]/45 shadow-[0_22px_50px_rgba(15,23,42,0.14)]"
                  : "border-[#eadfca] shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
                isPreview && "cursor-pointer",
              )}
              initial={false}
              animate={{
                x: `calc(-50% + ${offset * 58}%)`,
                y: "-50%",
                scale: isActive ? 1 : 0.72,
                opacity: isVisible ? (isActive ? 1 : 0.5) : 0,
                zIndex: isActive ? 20 : isPreview ? 10 : 0,
              }}
              transition={TRANSITION}
              aria-hidden={!isVisible}
              onClick={() => {
                if (isPreview) {
                  goTo(index);
                }
              }}
            >
              <div className="relative h-52 overflow-hidden bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.24),transparent_30%),linear-gradient(135deg,#fff8e8_0%,#ead8b8_45%,#102A43_120%)] sm:h-60">
                {device.imageSrc ? (
                  <Image
                    src={device.imageSrc}
                    alt={device.title}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 30rem, (min-width: 640px) 28rem, 78vw"
                    className="object-cover"
                    draggable={false}
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="font-serif text-xl font-bold leading-tight text-[#071225] sm:text-2xl">
                  {device.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">
                  {device.description}
                </p>
              </div>
            </m.article>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Sonraki kart"
        disabled={!canNext}
        onClick={() => go(1)}
        className={cn(
          "z-20 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#071225] shadow-md transition sm:size-11",
          "hover:border-[#D4AF37]/55 hover:text-[#B88A28]",
          "disabled:pointer-events-none disabled:opacity-30",
        )}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
